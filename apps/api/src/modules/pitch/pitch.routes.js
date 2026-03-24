const {
  createPitchController,
  listMyPitchesController,
  listAllPitchesController,
  getPitchByIdController,
  updatePitchController,
  deletePitchController,
} = require("./pitch.controller");

async function handlePitchRoutes(req, res) {
  const url = new URL(req.url, "http://localhost");
  const { pathname } = url;

  if (req.method === "POST" && pathname === "/pitches") {
    await createPitchController(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/pitches/my") {
    await listMyPitchesController(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/pitches") {
    await listAllPitchesController(req, res);
    return true;
  }

  const idMatch = pathname.match(/^\/pitches\/([0-9a-fA-F-]{36})$/);
  if (!idMatch) {
    return false;
  }

  const pitchId = idMatch[1];

  if (req.method === "GET") {
    await getPitchByIdController(req, res, pitchId);
    return true;
  }

  if (req.method === "PUT") {
    await updatePitchController(req, res, pitchId);
    return true;
  }

  if (req.method === "DELETE") {
    await deletePitchController(req, res, pitchId);
    return true;
  }

  return false;
}

module.exports = {
  handlePitchRoutes,
};
