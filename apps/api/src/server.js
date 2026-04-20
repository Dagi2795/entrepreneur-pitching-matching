const http = require("http");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../../.env"),
});

const { initDb } = require("@epm/db");
const { sendJson, handlePreflight } = require("./common/http");
const { handleHealthRoutes } = require("@epm/components/api/health/health.routes");
const { handleAuthRoutes } = require("@epm/components/api/auth/auth.routes");
const { handlePitchRoutes } = require("@epm/components/api/pitch/pitch.routes");
const { handleMatchingRoutes } = require("@epm/components/api/matching/matching.routes");
const { handleMessageRoutes } = require("@epm/components/api/messages/message.routes");
const {
  handleNotificationRoutes,
} = require("@epm/components/api/notifications/notification.routes");
const { handleAdminRoutes } = require("@epm/components/api/admin/admin.routes");

const port = process.env.PORT || 4000;

const server = http.createServer(async (req, res) => {
  try {
    if (handlePreflight(req, res)) {
      return;
    }

    if (await handleHealthRoutes(req, res)) {
      return;
    }

    if (await handleAuthRoutes(req, res)) {
      return;
    }

    if (await handlePitchRoutes(req, res)) {
      return;
    }

    if (await handleMatchingRoutes(req, res)) {
      return;
    }

    if (await handleMessageRoutes(req, res)) {
      return;
    }

    if (await handleNotificationRoutes(req, res)) {
      return;
    }

    if (await handleAdminRoutes(req, res)) {
      return;
    }

    sendJson(req, res, 404, { error: "route not found" });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    sendJson(req, res, statusCode, {
      error: error.message || "internal server error",
    });
  }
});

async function startServer() {
  await initDb();

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`port ${port} is already in use`);
      process.exit(1);
    }

    console.error("server error", error.message);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`api running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("failed to start api", error.message);
  process.exit(1);
});
