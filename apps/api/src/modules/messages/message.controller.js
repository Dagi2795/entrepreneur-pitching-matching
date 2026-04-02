const { readJsonBody, sendJson } = require("../../common/http");
const {
  listConversations,
  createConversation,
  listConversationMessages,
  sendMessage,
} = require("./message.service");

async function listConversationsController(req, res) {
  const conversations = await listConversations(req);
  sendJson(req, res, 200, { conversations });
}

async function createConversationController(req, res) {
  const payload = await readJsonBody(req);
  const result = await createConversation(req, payload);
  sendJson(req, res, result.created ? 201 : 200, result);
}

async function listConversationMessagesController(req, res, conversationId) {
  const result = await listConversationMessages(req, conversationId);
  sendJson(req, res, 200, result);
}

async function sendMessageController(req, res, conversationId) {
  const payload = await readJsonBody(req);
  const result = await sendMessage(req, conversationId, payload);
  sendJson(req, res, 201, result);
}

module.exports = {
  listConversationsController,
  createConversationController,
  listConversationMessagesController,
  sendMessageController,
};
