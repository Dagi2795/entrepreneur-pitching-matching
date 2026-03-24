const crypto = require("crypto");
const { query } = require("@epm/db");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function getSessionUser(req) {
  const token = getBearerToken(req);

  if (!token) {
    throw createHttpError(401, "missing bearer token");
  }

  const result = await query(
    `
      SELECT u.id, u.name, u.email, u.role
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = $1 AND s.revoked_at IS NULL
      LIMIT 1
    `,
    [token]
  );

  if (result.rowCount === 0) {
    throw createHttpError(401, "invalid session token");
  }

  return result.rows[0];
}

function ensureEntrepreneur(user) {
  if (user.role !== "entrepreneur") {
    throw createHttpError(403, "only entrepreneurs can manage pitches");
  }
}

function mapPitchRow(row) {
  return {
    id: row.id,
    entrepreneurId: row.entrepreneur_id,
    entrepreneurName: row.entrepreneur_name,
    startupName: row.startup_name,
    businessOverview: row.business_overview,
    problemSolution: row.problem_solution,
    marketOpportunity: row.market_opportunity,
    fundingRequest: Number(row.funding_request),
    supportingMedia: Array.isArray(row.supporting_media) ? row.supporting_media : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validatePayload(payload) {
  const startupName = String(payload.startupName || "").trim();
  const businessOverview = String(payload.businessOverview || "").trim();
  const problemSolution = String(payload.problemSolution || "").trim();
  const marketOpportunity = String(payload.marketOpportunity || "").trim();
  const fundingRequest = Number(payload.fundingRequest);
  const supportingMedia = payload.supportingMedia || [];

  if (!startupName || !businessOverview || !problemSolution || !marketOpportunity) {
    throw createHttpError(
      400,
      "startupName, businessOverview, problemSolution, and marketOpportunity are required"
    );
  }

  if (!Number.isFinite(fundingRequest) || fundingRequest <= 0) {
    throw createHttpError(400, "fundingRequest must be a positive number");
  }

  if (!Array.isArray(supportingMedia) || supportingMedia.some((item) => typeof item !== "string")) {
    throw createHttpError(400, "supportingMedia must be an array of strings");
  }

  return {
    startupName,
    businessOverview,
    problemSolution,
    marketOpportunity,
    fundingRequest,
    supportingMedia,
  };
}

async function createPitch(req, payload) {
  const user = await getSessionUser(req);
  ensureEntrepreneur(user);

  const data = validatePayload(payload);
  const id = crypto.randomUUID();

  const result = await query(
    `
      INSERT INTO pitches (
        id,
        entrepreneur_id,
        startup_name,
        business_overview,
        problem_solution,
        market_opportunity,
        funding_request,
        supporting_media
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      RETURNING id, entrepreneur_id, startup_name, business_overview,
                problem_solution, market_opportunity, funding_request,
                supporting_media, created_at, updated_at
    `,
    [
      id,
      user.id,
      data.startupName,
      data.businessOverview,
      data.problemSolution,
      data.marketOpportunity,
      data.fundingRequest,
      JSON.stringify(data.supportingMedia),
    ]
  );

  return mapPitchRow(result.rows[0]);
}

async function listMyPitches(req) {
  const user = await getSessionUser(req);
  ensureEntrepreneur(user);

  const result = await query(
    `
      SELECT p.id, p.entrepreneur_id, u.name AS entrepreneur_name,
             p.startup_name, p.business_overview, p.problem_solution,
             p.market_opportunity, p.funding_request, p.supporting_media,
             p.created_at, p.updated_at
      FROM pitches p
      JOIN users u ON u.id = p.entrepreneur_id
      WHERE p.entrepreneur_id = $1
      ORDER BY p.created_at DESC
    `,
    [user.id]
  );

  return result.rows.map(mapPitchRow);
}

async function listAllPitches(req) {
  await getSessionUser(req);

  const result = await query(
    `
      SELECT p.id, p.entrepreneur_id, u.name AS entrepreneur_name,
             p.startup_name, p.business_overview, p.problem_solution,
             p.market_opportunity, p.funding_request, p.supporting_media,
             p.created_at, p.updated_at
      FROM pitches p
      JOIN users u ON u.id = p.entrepreneur_id
      ORDER BY p.created_at DESC
    `
  );

  return result.rows.map(mapPitchRow);
}

async function getPitchById(req, pitchId) {
  await getSessionUser(req);

  const result = await query(
    `
      SELECT p.id, p.entrepreneur_id, u.name AS entrepreneur_name,
             p.startup_name, p.business_overview, p.problem_solution,
             p.market_opportunity, p.funding_request, p.supporting_media,
             p.created_at, p.updated_at
      FROM pitches p
      JOIN users u ON u.id = p.entrepreneur_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [pitchId]
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, "pitch not found");
  }

  return mapPitchRow(result.rows[0]);
}

async function updatePitch(req, pitchId, payload) {
  const user = await getSessionUser(req);
  ensureEntrepreneur(user);

  const ownerResult = await query(
    "SELECT entrepreneur_id FROM pitches WHERE id = $1 LIMIT 1",
    [pitchId]
  );

  if (ownerResult.rowCount === 0) {
    throw createHttpError(404, "pitch not found");
  }

  if (ownerResult.rows[0].entrepreneur_id !== user.id) {
    throw createHttpError(403, "you can only edit your own pitches");
  }

  const data = validatePayload(payload);

  const result = await query(
    `
      UPDATE pitches
      SET startup_name = $1,
          business_overview = $2,
          problem_solution = $3,
          market_opportunity = $4,
          funding_request = $5,
          supporting_media = $6::jsonb,
          updated_at = NOW()
      WHERE id = $7
      RETURNING id, entrepreneur_id, startup_name, business_overview,
                problem_solution, market_opportunity, funding_request,
                supporting_media, created_at, updated_at
    `,
    [
      data.startupName,
      data.businessOverview,
      data.problemSolution,
      data.marketOpportunity,
      data.fundingRequest,
      JSON.stringify(data.supportingMedia),
      pitchId,
    ]
  );

  return mapPitchRow(result.rows[0]);
}

async function deletePitch(req, pitchId) {
  const user = await getSessionUser(req);
  ensureEntrepreneur(user);

  const result = await query(
    "DELETE FROM pitches WHERE id = $1 AND entrepreneur_id = $2",
    [pitchId, user.id]
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, "pitch not found or not owned by you");
  }
}

module.exports = {
  createPitch,
  listMyPitches,
  listAllPitches,
  getPitchById,
  updatePitch,
  deletePitch,
};
