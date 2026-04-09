const {
  listNotificationsController,
  unreadNotificationCountController,
  markNotificationReadController,
  markAllNotificationsReadController,
} = require("./notification.controller");

async function handleNotificationRoutes(req, res) {
  const url = new URL(req.url, "http://localhost");
  const { pathname } = url;

  if (req.method === "GET" && pathname === "/notifications") {
    await listNotificationsController(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/notifications/unread-count") {
    await unreadNotificationCountController(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/notifications/read-all") {
    await markAllNotificationsReadController(req, res);
    return true;
  }

  const notificationIdMatch = pathname.match(/^\/notifications\/([0-9a-fA-F-]{36})\/read$/);
  if (notificationIdMatch && req.method === "POST") {
    await markNotificationReadController(req, res, notificationIdMatch[1]);
    return true;
  }

  return false;
}

module.exports = {
  handleNotificationRoutes,
};
