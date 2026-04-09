import { apiRequest } from "./api";

export async function listNotifications() {
  const data = await apiRequest("/notifications", { method: "GET" });
  return data.notifications || [];
}

export async function getUnreadNotificationCount() {
  const data = await apiRequest("/notifications/unread-count", { method: "GET" });
  return Number(data.unreadCount || 0);
}

export async function markNotificationRead(notificationId) {
  const data = await apiRequest(`/notifications/${notificationId}/read`, { method: "POST" });
  return data.notification;
}

export async function markAllNotificationsRead() {
  const data = await apiRequest("/notifications/read-all", { method: "POST" });
  return Number(data.updatedCount || 0);
}
