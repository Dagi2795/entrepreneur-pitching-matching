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

function parseNumber(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw createHttpError(400, `${label} must be a valid number`);
  }

  return parsed;
}

function parseKeywords(rawKeywords) {
  if (!rawKeywords) {
    return [];
  }

  return String(rawKeywords)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function calculateFundingScore(fundingRequest, minFunding, maxFunding, reasons) {
  if (minFunding === null && maxFunding === null) {
    reasons.push("No funding range provided, using neutral funding score");
    return 20;
  }

  if (
    (minFunding === null || fundingRequest >= minFunding) &&
    (maxFunding === null || fundingRequest <= maxFunding)
  ) {
    reasons.push("Funding request is inside your target range");
    return 50;
  }

  const lowerGap = minFunding !== null ? Math.max(0, minFunding - fundingRequest) : 0;
  const upperGap = maxFunding !== null ? Math.max(0, fundingRequest - maxFunding) : 0;
  const gap = lowerGap + upperGap;

  // Soft penalty for near misses so investors still get options.
  const score = Math.max(0, 30 - gap / 10000);
  reasons.push("Funding request is close to your range");
  return score;
}

function calculateKeywordScore(textBlob, keywords, reasons) {
  if (keywords.length === 0) {
    reasons.push("No keyword preference provided");
    return 0;
  }

  let matches = 0;
  for (const keyword of keywords) {
    if (textBlob.includes(keyword)) {
      matches += 1;
    }
  }

  if (matches === 0) {
    reasons.push("No keyword overlap found");
    return 0;
  }

  reasons.push(`${matches} keyword preference(s) matched`);
  return Math.min(30, matches * 10);
}

function calculateRecencyScore(createdAt) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.max(0, 20 - ageDays);
}

function mapPitch(row, score, reasons) {
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
    matchingScore: Math.round(score * 100) / 100,
    reasons,
  };
}

async function getRecommendations(req, filters) {
  const user = await getSessionUser(req);

  if (user.role !== "investor" && user.role !== "admin") {
    throw createHttpError(403, "only investors or admins can request recommendations");
  }

  const minFunding = parseNumber(filters.minFunding, "minFunding");
  const maxFunding = parseNumber(filters.maxFunding, "maxFunding");

  if (minFunding !== null && maxFunding !== null && minFunding > maxFunding) {
    throw createHttpError(400, "minFunding cannot be greater than maxFunding");
  }

  const keywords = parseKeywords(filters.keywords);

  const pitchesResult = await query(
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

  const recommendations = pitchesResult.rows
    .map((row) => {
      const reasons = [];
      const textBlob = `${row.startup_name} ${row.business_overview} ${row.problem_solution} ${row.market_opportunity}`.toLowerCase();

      const fundingScore = calculateFundingScore(
        Number(row.funding_request),
        minFunding,
        maxFunding,
        reasons
      );
      const keywordScore = calculateKeywordScore(textBlob, keywords, reasons);
      const recencyScore = calculateRecencyScore(row.created_at);

      const totalScore = fundingScore + keywordScore + recencyScore;
      return mapPitch(row, totalScore, reasons);
    })
    .sort((a, b) => b.matchingScore - a.matchingScore);

  return {
    filters: {
      minFunding,
      maxFunding,
      keywords,
    },
    recommendations,
  };
}

module.exports = {
  getRecommendations,
};
