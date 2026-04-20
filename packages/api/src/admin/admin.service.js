const { query } = require("@epm/db");
const { getSessionUser } = require("../auth/auth.service");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureAdmin(req) {
  const user = await getSessionUser(req);
  if (user.role !== "admin") {
    throw createHttpError(403, "admin access required");
  }

  return user;
}

function mapUserRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

function mapPitchRow(row) {
  return {
    id: row.id,
    entrepreneurId: row.entrepreneur_id,
    entrepreneurName: row.entrepreneur_name,
    startupName: row.startup_name,
    fundingRequest: Number(row.funding_request),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listUsers(req) {
  await ensureAdmin(req);

  const result = await query(
    `
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 200
    `
  );

  return result.rows.map(mapUserRow);
}

async function listPitches(req) {
  await ensureAdmin(req);

  const result = await query(
    `
      SELECT
        p.id,
        p.entrepreneur_id,
        u.name AS entrepreneur_name,
        p.startup_name,
        p.funding_request,
        p.created_at,
        p.updated_at
      FROM pitches p
      JOIN users u ON u.id = p.entrepreneur_id
      ORDER BY p.created_at DESC
      LIMIT 200
    `
  );

  return result.rows.map(mapPitchRow);
}

async function deletePitchByAdmin(req, pitchId) {
  await ensureAdmin(req);

  const result = await query(
    `
      DELETE FROM pitches
      WHERE id = $1
      RETURNING id
    `,
    [pitchId]
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, "pitch not found");
  }
}

module.exports = {
  listUsers,
  listPitches,
  deletePitchByAdmin,
};
