const { sendJson } = require("../../common/http");
const { listUsers, listPitches, deletePitchByAdmin } = require("./admin.service");

async function listUsersController(req, res) {
  const users = await listUsers(req);
  sendJson(req, res, 200, { users });
}

async function listPitchesController(req, res) {
  const pitches = await listPitches(req);
  sendJson(req, res, 200, { pitches });
}

async function deletePitchController(req, res, pitchId) {
  await deletePitchByAdmin(req, pitchId);
  sendJson(req, res, 200, { message: "pitch deleted by admin" });
}

module.exports = {
  listUsersController,
  listPitchesController,
  deletePitchController,
};
