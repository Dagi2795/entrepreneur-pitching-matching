import { getToken } from "./auth";
import { API_BASE, apiRequest } from "./api";

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

export function subscribeToConversation(conversationId, handlers = {}) {
  const token = getToken();
  const streamUrl = `${API_BASE}/messages/conversations/${conversationId}/stream?token=${encodeURIComponent(token)}`;
  const eventSource = new EventSource(streamUrl);

  if (handlers.onOpen) {
    eventSource.onopen = handlers.onOpen;
  }

  if (handlers.onError) {
    eventSource.onerror = handlers.onError;
  }

  eventSource.addEventListener("conversation-message", (event) => {
    try {
      const payload = JSON.parse(event.data || "{}");
      if (handlers.onMessage && payload.message) {
        handlers.onMessage(payload.message);
      }
    } catch (error) {
      if (handlers.onError) {
        handlers.onError(error);
      }
    }
  });

  return () => {
    eventSource.close();
  };
}
