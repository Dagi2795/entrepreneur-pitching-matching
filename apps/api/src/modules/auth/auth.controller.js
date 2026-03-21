const { readJsonBody, sendJson } = require("../../common/http");
const {
  registerUser,
  loginUser,
  logoutUser,
  getMyProfile,
  updateMyProfile,
} = require("./auth.service");

async function registerController(req, res) {
  const payload = await readJsonBody(req);
  const user = await registerUser(payload);

  sendJson(req, res, 201, {
    message: "registered",
    user,
  });
}

async function loginController(req, res) {
  const payload = await readJsonBody(req);
  const result = await loginUser(payload);

  sendJson(req, res, 200, {
    message: "logged in",
    token: result.token,
    user: result.user,
  });
}

async function logoutController(req, res) {
  await logoutUser(req);
  sendJson(req, res, 200, { message: "logged out" });
}

async function getMyProfileController(req, res) {
  const profile = await getMyProfile(req);
  sendJson(req, res, 200, { profile });
}

async function updateMyProfileController(req, res) {
  const payload = await readJsonBody(req);
  const profile = await updateMyProfile(req, payload);
  sendJson(req, res, 200, { message: "profile updated", profile });
}

module.exports = {
  registerController,
  loginController,
  logoutController,
  getMyProfileController,
  updateMyProfileController,
};
