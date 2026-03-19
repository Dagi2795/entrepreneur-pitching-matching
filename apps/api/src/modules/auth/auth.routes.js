const {
  registerController,
  loginController,
  logoutController,
} = require("./auth.controller");

async function handleAuthRoutes(req, res) {
  if (req.method === "POST" && req.url === "/auth/register") {
    await registerController(req, res);
    return true;
  }

  if (req.method === "POST" && req.url === "/auth/login") {
    await loginController(req, res);
    return true;
  }

  if (req.method === "POST" && req.url === "/auth/logout") {
    await logoutController(req, res);
    return true;
  }

  return false;
}

module.exports = {
  handleAuthRoutes,
};
