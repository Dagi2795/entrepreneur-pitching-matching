const {
  listUsersController,
  listPitchesController,
  deletePitchController,
} = require("./admin.controller");

async function handleAdminRoutes(req, res) {
  const url = new URL(req.url, "http://localhost");
  const { pathname } = url;

  if (req.method === "GET" && pathname === "/admin/users") {
    await listUsersController(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/admin/pitches") {
    await listPitchesController(req, res);
    return true;
  }

  const pitchIdMatch = pathname.match(/^\/admin\/pitches\/([0-9a-fA-F-]{36})$/);
  if (pitchIdMatch && req.method === "DELETE") {
    await deletePitchController(req, res, pitchIdMatch[1]);
    return true;
  }

  return false;
}

module.exports = {
  handleAdminRoutes,
};
