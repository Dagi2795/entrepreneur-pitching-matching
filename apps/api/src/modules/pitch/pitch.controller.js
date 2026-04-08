const { readJsonBody, sendJson } = require("../../common/http");
const {
  createPitch,
  listMyPitches,
  listAllPitches,
  getPitchById,
  updatePitch,
  deletePitch,
} = require("./pitch.service");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseFundingParam(rawValue, label) {
  if (rawValue === null || rawValue === "") {
    return undefined;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw createHttpError(400, `${label} must be a non-negative number`);
  }

  return parsed;
}

function parseBrowseFilters(req) {
  const url = new URL(req.url, "http://localhost");
  const keyword = String(url.searchParams.get("q") || "").trim();
  const minFunding = parseFundingParam(url.searchParams.get("minFunding"), "minFunding");
  const maxFunding = parseFundingParam(url.searchParams.get("maxFunding"), "maxFunding");

  if (
    typeof minFunding === "number" &&
    typeof maxFunding === "number" &&
    minFunding > maxFunding
  ) {
    throw createHttpError(400, "minFunding cannot be greater than maxFunding");
  }

  return {
    keyword,
    minFunding,
    maxFunding,
  };
}

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
  const filters = parseBrowseFilters(req);
  const pitches = await listAllPitches(req, filters);
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
