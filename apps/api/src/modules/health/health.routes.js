const { sendJson } = require("../../common/http");
const { checkDbHealth } = require("@epm/db");

async function handleHealthRoutes(req, res) {
  if (req.method === "GET" && req.url === "/health") {
    try {
      await checkDbHealth();
      sendJson(res, 200, {
        app: "api",
        status: "healthy",
        database: "connected",
      });
    } catch (error) {
      sendJson(res, 503, {
        app: "api",
        status: "degraded",
        database: "disconnected",
      });
    }

    return true;
  }

  return false;
}

module.exports = {
  handleHealthRoutes,
};
