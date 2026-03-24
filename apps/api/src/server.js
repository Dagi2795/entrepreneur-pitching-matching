const http = require("http");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../../.env"),
});

const { initDb } = require("@epm/db");
const { sendJson, handlePreflight } = require("./common/http");
const { handleHealthRoutes } = require("./modules/health/health.routes");
const { handleAuthRoutes } = require("./modules/auth/auth.routes");
const { handlePitchRoutes } = require("./modules/pitch/pitch.routes");

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

  server.listen(port, () => {
    console.log(`api running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("failed to start api", error.message);
  process.exit(1);
});
