const {
  listConversationsController,
  createConversationController,
  listConversationMessagesController,
  sendMessageController,
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

  return false;
}

module.exports = {
  handleMessageRoutes,
};
