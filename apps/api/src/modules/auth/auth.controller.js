const { readJsonBody, sendJson } = require("../../common/http");
const { registerUser, loginUser, logoutUser } = require("./auth.service");

async function registerController(req, res) {
  const payload = await readJsonBody(req);
  const user = await registerUser(payload);

  sendJson(res, 201, {
    message: "registered",
    user,
  });
}

async function loginController(req, res) {
  const payload = await readJsonBody(req);
  const result = await loginUser(payload);

  sendJson(res, 200, {
    message: "logged in",
    token: result.token,
    user: result.user,
  });
}

async function logoutController(req, res) {
  await logoutUser(req);
  sendJson(res, 200, { message: "logged out" });
}

module.exports = {
  registerController,
  loginController,
  logoutController,
};
