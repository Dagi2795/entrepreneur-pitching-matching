const { sendJson } = require("../../common/http");
const {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} = require("./notification.service");

async function listNotificationsController(req, res) {
  const notifications = await listNotifications(req);
  sendJson(req, res, 200, { notifications });
}

async function unreadNotificationCountController(req, res) {
  const result = await getUnreadNotificationCount(req);
  sendJson(req, res, 200, result);
}

async function markNotificationReadController(req, res, notificationId) {
  const notification = await markNotificationRead(req, notificationId);
  sendJson(req, res, 200, { message: "notification marked as read", notification });
}

async function markAllNotificationsReadController(req, res) {
  const result = await markAllNotificationsRead(req);
  sendJson(req, res, 200, {
    message: "all notifications marked as read",
    updatedCount: result.updatedCount,
  });
}

module.exports = {
  listNotificationsController,
  unreadNotificationCountController,
  markNotificationReadController,
  markAllNotificationsReadController,
};
