const { readJsonBody, sendJson } = require("../../common/http");
const {
  createPitch,
  listMyPitches,
  listAllPitches,
  getPitchById,
  updatePitch,
  deletePitch,
} = require("./pitch.service");

async function createPitchController(req, res) {
  const payload = await readJsonBody(req);
  const pitch = await createPitch(req, payload);
  sendJson(req, res, 201, { message: "pitch created", pitch });
}

async function listMyPitchesController(req, res) {
  const pitches = await listMyPitches(req);
  sendJson(req, res, 200, { pitches });
}

async function listAllPitchesController(req, res) {
  const pitches = await listAllPitches(req);
  sendJson(req, res, 200, { pitches });
}

async function getPitchByIdController(req, res, pitchId) {
  const pitch = await getPitchById(req, pitchId);
  sendJson(req, res, 200, { pitch });
}

async function updatePitchController(req, res, pitchId) {
  const payload = await readJsonBody(req);
  const pitch = await updatePitch(req, pitchId, payload);
  sendJson(req, res, 200, { message: "pitch updated", pitch });
}

async function deletePitchController(req, res, pitchId) {
  await deletePitch(req, pitchId);
  sendJson(req, res, 200, { message: "pitch deleted" });
}

module.exports = {
  createPitchController,
  listMyPitchesController,
  listAllPitchesController,
  getPitchByIdController,
  updatePitchController,
  deletePitchController,
};
