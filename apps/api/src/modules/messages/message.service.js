const crypto = require("crypto");
const { query } = require("@epm/db");
const { getSessionUser } = require("../auth/auth.service");
const { setCorsHeaders } = require("../../common/http");

const conversationSubscribers = new Map();

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeUuidList(payload) {
  const rawParticipantIds = [];

  if (Array.isArray(payload.participantIds)) {
    rawParticipantIds.push(...payload.participantIds);
  }

  if (payload.participantId) {
    rawParticipantIds.push(payload.participantId);
  }

  const uniqueIds = [...new Set(rawParticipantIds.map((value) => String(value).trim()).filter(Boolean))];
  return uniqueIds;
}

function isUuidLike(value) {
  return typeof value === "string" && /^[0-9a-fA-F-]{36}$/.test(value);
}

function buildParticipantsKey(participantIds) {
  return [...participantIds].sort().join(":");
}

function mapConversationRow(row) {
  return {
    id: row.id,
    createdBy: row.created_by,
    participantsKey: row.participants_key,
    participantCount: Number(row.participant_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
    participants: row.participants || [],
    lastMessage: row.last_message_id
      ? {
          id: row.last_message_id,
          conversationId: row.id,
          senderId: row.last_message_sender_id,
          senderName: row.last_message_sender_name,
          body: row.last_message_body,
          createdAt: row.last_message_created_at,
        }
      : null,
  };
}

function mapMessageRow(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

function validateBody(payload) {
  const body = String(payload.body || "").trim();
  if (!body) {
    throw createHttpError(400, "body is required");
  }

  return body;
}

function getConversationSubscriberSet(conversationId) {
  if (!conversationSubscribers.has(conversationId)) {
    conversationSubscribers.set(conversationId, new Set());
  }

  return conversationSubscribers.get(conversationId);
}

function addConversationSubscriber(conversationId, subscriber) {
  const set = getConversationSubscriberSet(conversationId);
  set.add(subscriber);
}

function removeConversationSubscriber(conversationId, subscriber) {
  const set = conversationSubscribers.get(conversationId);
  if (!set) {
    return;
  }

  set.delete(subscriber);
  if (set.size === 0) {
    conversationSubscribers.delete(conversationId);
  }
}

function publishConversationMessage(message) {
  const subscribers = conversationSubscribers.get(message.conversationId);
  if (!subscribers || subscribers.size === 0) {
    return;
  }

  const payload = JSON.stringify({ message });
  for (const subscriber of subscribers) {
    try {
      subscriber.res.write(`event: conversation-message\n`);
      subscriber.res.write(`data: ${payload}\n\n`);
    } catch (error) {
      removeConversationSubscriber(message.conversationId, subscriber);
    }
  }
}

async function getSessionUserFromToken(token) {
  if (!token) {
    throw createHttpError(401, "missing bearer token");
  }

  const userResult = await query(
    `
      SELECT u.id, u.name, u.email, u.role, u.bio, u.interests, u.contact_info, u.photo_url
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = $1 AND s.revoked_at IS NULL
      LIMIT 1
    `,
    [token]
  );

  if (userResult.rowCount === 0) {
    throw createHttpError(401, "invalid session token");
  }

  return userResult.rows[0];
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function openConversationStream(req, res, conversationId, tokenFromQuery) {
  const token = tokenFromQuery || getBearerToken(req);
  const user = token ? await getSessionUserFromToken(token) : await getSessionUser(req);
  await ensureConversationAccess(conversationId, user.id);

  setCorsHeaders(req, res);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const subscriber = {
    id: crypto.randomUUID(),
    userId: user.id,
    res,
  };

  addConversationSubscriber(conversationId, subscriber);

  res.write("event: connected\n");
  res.write(`data: ${JSON.stringify({ conversationId, subscriberId: subscriber.id })}\n\n`);

  const keepAliveInterval = setInterval(() => {
    try {
      res.write(": keep-alive\n\n");
    } catch (error) {
      clearInterval(keepAliveInterval);
      removeConversationSubscriber(conversationId, subscriber);
    }
  }, 25000);

  const closeStream = () => {
    clearInterval(keepAliveInterval);
    removeConversationSubscriber(conversationId, subscriber);
  };

  req.on("close", closeStream);
  req.on("error", closeStream);
}

function ensureInvestorOrAdmin(user) {
  if (user.role !== "investor" && user.role !== "admin") {
    throw createHttpError(403, "only investors or admins can start pitch conversations");
  }
}

async function createOrReuseConversation(user, participantIds) {
  const mergedParticipantIds = [...new Set([user.id, ...participantIds])];

  if (mergedParticipantIds.length < 2) {
    throw createHttpError(400, "conversation must include at least one other participant");
  }

  const participantLookup = await query(
    "SELECT id, name, email, role FROM users WHERE id = ANY($1::uuid[])",
    [mergedParticipantIds]
  );

  if (participantLookup.rowCount !== mergedParticipantIds.length) {
    throw createHttpError(404, "one or more participants were not found");
  }

  const participantsKey = buildParticipantsKey(mergedParticipantIds);

  const existingConversation = await query(
    `
      SELECT id
      FROM conversations
      WHERE participants_key = $1
      LIMIT 1
    `,
    [participantsKey]
  );

  let conversationId = existingConversation.rows[0]?.id;
  let created = false;

  if (!conversationId) {
    conversationId = crypto.randomUUID();
    created = true;

    await query(
      `
        INSERT INTO conversations (
          id,
          created_by,
          participants_key,
          participant_count
        )
        VALUES ($1, $2, $3, $4)
      `,
      [conversationId, user.id, participantsKey, mergedParticipantIds.length]
    );

    for (const participantId of mergedParticipantIds) {
      await query(
        `
          INSERT INTO conversation_participants (conversation_id, user_id)
          VALUES ($1, $2)
        `,
        [conversationId, participantId]
      );
    }
  }

  const conversationResult = await query(
    `
      SELECT
        c.id,
        c.created_by,
        c.participants_key,
        c.participant_count,
        c.created_at,
        c.updated_at,
        c.last_message_at,
        lm.id AS last_message_id,
        lm.sender_id AS last_message_sender_id,
        lm.body AS last_message_body,
        lm.created_at AS last_message_created_at,
        sender.name AS last_message_sender_name,
        participants.participants
      FROM conversations c
      LEFT JOIN LATERAL (
        SELECT
          m.id,
          m.sender_id,
          m.body,
          m.created_at
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) lm ON true
      LEFT JOIN users sender ON sender.id = lm.sender_id
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'role', u.role
          )
          ORDER BY u.name
        ) AS participants
        FROM conversation_participants cp
        JOIN users u ON u.id = cp.user_id
        WHERE cp.conversation_id = c.id
      ) participants ON true
      WHERE c.id = $1
      LIMIT 1
    `,
    [conversationId]
  );

  return {
    created,
    conversation: mapConversationRow(conversationResult.rows[0]),
  };
}

async function createConversationFromPitch(req, pitchId) {
  const user = await getSessionUser(req);
  ensureInvestorOrAdmin(user);

  const pitchResult = await query(
    `
      SELECT id, entrepreneur_id
      FROM pitches
      WHERE id = $1
      LIMIT 1
    `,
    [pitchId]
  );

  if (pitchResult.rowCount === 0) {
    throw createHttpError(404, "pitch not found");
  }

  const pitch = pitchResult.rows[0];
  if (pitch.entrepreneur_id === user.id) {
    throw createHttpError(400, "cannot start a conversation with yourself");
  }

  return createOrReuseConversation(user, [pitch.entrepreneur_id]);
}

async function ensureConversationAccess(conversationId, userId) {
  const result = await query(
    `
      SELECT c.id
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id
      WHERE c.id = $1 AND cp.user_id = $2
      LIMIT 1
    `,
    [conversationId, userId]
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, "conversation not found");
  }
}

async function listConversations(req) {
  const user = await getSessionUser(req);

  const result = await query(
    `
      SELECT
        c.id,
        c.created_by,
        c.participants_key,
        c.participant_count,
        c.created_at,
        c.updated_at,
        c.last_message_at,
        lm.id AS last_message_id,
        lm.sender_id AS last_message_sender_id,
        lm.body AS last_message_body,
        lm.created_at AS last_message_created_at,
        sender.name AS last_message_sender_name,
        participants.participants
      FROM conversations c
      JOIN conversation_participants me
        ON me.conversation_id = c.id AND me.user_id = $1
      LEFT JOIN LATERAL (
        SELECT
          m.id,
          m.sender_id,
          m.body,
          m.created_at
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) lm ON true
      LEFT JOIN users sender ON sender.id = lm.sender_id
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'role', u.role
          )
          ORDER BY u.name
        ) AS participants
        FROM conversation_participants cp
        JOIN users u ON u.id = cp.user_id
        WHERE cp.conversation_id = c.id
      ) participants ON true
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
    `,
    [user.id]
  );

  return result.rows.map(mapConversationRow);
}

async function createConversation(req, payload) {
  const user = await getSessionUser(req);
  const participantIds = normalizeUuidList(payload);

  if (participantIds.length === 0) {
    throw createHttpError(400, "participantId or participantIds is required");
  }

  const invalidParticipantId = participantIds.find((value) => !isUuidLike(value));
  if (invalidParticipantId) {
    throw createHttpError(400, "participantIds must contain valid UUID values");
  }

  if (participantIds.includes(user.id) && participantIds.length === 1) {
    throw createHttpError(400, "conversation must include at least one other participant");
  }

  const mergedParticipantIds = [...new Set([user.id, ...participantIds])];

  if (mergedParticipantIds.length < 2) {
    throw createHttpError(400, "conversation must include at least one other participant");
  }
  return createOrReuseConversation(user, mergedParticipantIds);
}

async function listConversationMessages(req, conversationId) {
  const user = await getSessionUser(req);
  await ensureConversationAccess(conversationId, user.id);

  const conversationResult = await query(
    `
      SELECT
        c.id,
        c.created_by,
        c.participants_key,
        c.participant_count,
        c.created_at,
        c.updated_at,
        c.last_message_at,
        participants.participants
      FROM conversations c
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'role', u.role
          )
          ORDER BY u.name
        ) AS participants
        FROM conversation_participants cp
        JOIN users u ON u.id = cp.user_id
        WHERE cp.conversation_id = c.id
      ) participants ON true
      WHERE c.id = $1
      LIMIT 1
    `,
    [conversationId]
  );

  const messagesResult = await query(
    `
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        sender.name AS sender_name,
        m.body,
        m.created_at,
        m.read_at
      FROM messages m
      JOIN users sender ON sender.id = m.sender_id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `,
    [conversationId]
  );

  return {
    conversation: mapConversationRow(conversationResult.rows[0]),
    messages: messagesResult.rows.map(mapMessageRow),
  };
}

async function sendMessage(req, conversationId, payload) {
  const user = await getSessionUser(req);
  await ensureConversationAccess(conversationId, user.id);

  const body = validateBody(payload);
  const messageId = crypto.randomUUID();

  const result = await query(
    `
      INSERT INTO messages (id, conversation_id, sender_id, body)
      VALUES ($1, $2, $3, $4)
      RETURNING id, conversation_id, sender_id, body, created_at, read_at
    `,
    [messageId, conversationId, user.id, body]
  );

  await query(
    `
      UPDATE conversations
      SET updated_at = NOW(),
          last_message_at = NOW()
      WHERE id = $1
    `,
    [conversationId]
  );

  const messageResult = await query(
    `
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        sender.name AS sender_name,
        m.body,
        m.created_at,
        m.read_at
      FROM messages m
      JOIN users sender ON sender.id = m.sender_id
      WHERE m.id = $1
      LIMIT 1
    `,
    [result.rows[0].id]
  );

  const message = mapMessageRow(messageResult.rows[0]);
  publishConversationMessage(message);

  return {
    message,
  };
}

module.exports = {
  listConversations,
  createConversation,
  createConversationFromPitch,
  listConversationMessages,
  sendMessage,
  openConversationStream,
};
