const crypto = require("crypto");
const { query } = require("@epm/db");
const { getSessionUser } = require("../auth/auth.service");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function mapNotificationRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

async function createNotification({ userId, type, title, body = null, metadata = {} }) {
  if (!userId || !type || !title) {
    throw createHttpError(400, "userId, type, and title are required to create notification");
  }

  const id = crypto.randomUUID();

  const result = await query(
    `
      INSERT INTO notifications (id, user_id, type, title, body, metadata)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING id, user_id, type, title, body, metadata, created_at, read_at
    `,
    [id, userId, type, title, body, JSON.stringify(metadata || {})]
  );

  return mapNotificationRow(result.rows[0]);
}

async function listNotifications(req) {
  const user = await getSessionUser(req);

  const result = await query(
    `
      SELECT id, user_id, type, title, body, metadata, created_at, read_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `,
    [user.id]
  );

  return result.rows.map(mapNotificationRow);
}

async function getUnreadNotificationCount(req) {
  const user = await getSessionUser(req);

  const result = await query(
    `
      SELECT COUNT(*)::int AS unread_count
      FROM notifications
      WHERE user_id = $1 AND read_at IS NULL
    `,
    [user.id]
  );

  return {
    unreadCount: result.rows[0]?.unread_count || 0,
  };
}

async function markNotificationRead(req, notificationId) {
  const user = await getSessionUser(req);

  const result = await query(
    `
      UPDATE notifications
      SET read_at = COALESCE(read_at, NOW())
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, type, title, body, metadata, created_at, read_at
    `,
    [notificationId, user.id]
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, "notification not found");
  }

  return mapNotificationRow(result.rows[0]);
}

async function markAllNotificationsRead(req) {
  const user = await getSessionUser(req);

  const result = await query(
    `
      UPDATE notifications
      SET read_at = NOW()
      WHERE user_id = $1 AND read_at IS NULL
    `,
    [user.id]
  );

  return {
    updatedCount: result.rowCount,
  };
}

module.exports = {
  createNotification,
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
};
