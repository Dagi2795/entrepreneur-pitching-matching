const {
  registerController,
  loginController,
  logoutController,
  getMyProfileController,
  updateMyProfileController,
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

  if (req.method === "GET" && req.url === "/auth/me") {
    await getMyProfileController(req, res);
    return true;
  }

  if (req.method === "PUT" && req.url === "/auth/me") {
    await updateMyProfileController(req, res);
    return true;
  }

  return false;
}

module.exports = {
  handleAuthRoutes,
};
