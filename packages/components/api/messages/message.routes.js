const {
  listConversationsController,
  createConversationController,
  createConversationFromPitchController,
  listConversationMessagesController,
  sendMessageController,
  streamConversationController,
} = require("./message.controller");

async function handleMessageRoutes(req, res) {
  const url = new URL(req.url, "http://localhost");
  const { pathname } = url;

  if (req.method === "GET" && pathname === "/messages/conversations") {
    await listConversationsController(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/messages/conversations") {
    await createConversationController(req, res);
    return true;
  }

  const pitchConversationMatch = pathname.match(
    /^\/messages\/conversations\/from-pitch\/([0-9a-fA-F-]{36})$/
  );

  if (pitchConversationMatch && req.method === "POST") {
    await createConversationFromPitchController(req, res, pitchConversationMatch[1]);
    return true;
  }

  const conversationMessagesMatch = pathname.match(
    /^\/messages\/conversations\/([0-9a-fA-F-]{36})\/messages$/
  );

  if (conversationMessagesMatch) {
    const conversationId = conversationMessagesMatch[1];

    if (req.method === "GET") {
      await listConversationMessagesController(req, res, conversationId);
      return true;
    }

    if (req.method === "POST") {
      await sendMessageController(req, res, conversationId);
      return true;
    }
  }

  const conversationStreamMatch = pathname.match(
    /^\/messages\/conversations\/([0-9a-fA-F-]{36})\/stream$/
  );

  if (conversationStreamMatch && req.method === "GET") {
    const token = url.searchParams.get("token");
    await streamConversationController(req, res, conversationStreamMatch[1], token);
    return true;
  }

  return false;
}

module.exports = {
  handleMessageRoutes,
};
