import { apiRequest } from "./api";

export async function listConversations() {
  return apiRequest("/messages/conversations", { method: "GET" });
}

export async function createConversation(participantIds) {
  const payload = {
    participantIds,
  };

  return apiRequest("/messages/conversations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function openPitchConversation(pitchId) {
  return apiRequest(`/messages/conversations/from-pitch/${pitchId}`, {
    method: "POST",
  });
}

export async function listConversationMessages(conversationId) {
  return apiRequest(`/messages/conversations/${conversationId}/messages`, {
    method: "GET",
  });
}

export async function sendMessage(conversationId, body) {
  return apiRequest(`/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
