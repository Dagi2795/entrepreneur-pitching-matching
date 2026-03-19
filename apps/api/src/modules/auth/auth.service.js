const crypto = require("crypto");
const { query } = require("@epm/db");

const allowedRoles = new Set(["entrepreneur", "investor", "admin"]);

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function hashPassword(password, salt) {
  return crypto
    .createHash("sha256")
    .update(`${salt}:${password}`)
    .digest("hex");
}

async function registerUser(payload) {
  const { name, email, password, role } = payload;

  if (!name || !email || !password || !role) {
    throw createHttpError(400, "name, email, password, and role are required");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (!allowedRoles.has(role)) {
    throw createHttpError(400, "role must be entrepreneur, investor, or admin");
  }

  const existingUser = await query("SELECT id FROM users WHERE email = $1", [
    normalizedEmail,
  ]);

  if (existingUser.rowCount > 0) {
    throw createHttpError(409, "email already registered");
  }

  const salt = crypto.randomUUID();
  const passwordHash = `${salt}:${hashPassword(String(password), salt)}`;
  const user = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: normalizedEmail,
    role,
    passwordHash,
  };

  await query(
    "INSERT INTO users (id, name, email, role, password_hash) VALUES ($1, $2, $3, $4, $5)",
    [user.id, user.name, user.email, user.role, user.passwordHash]
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function verifyPassword(storedPasswordHash, plainPassword) {
  const [salt, hashed] = String(storedPasswordHash).split(":");
  if (!salt || !hashed) {
    return false;
  }

  const candidateHash = hashPassword(plainPassword, salt);
  return crypto.timingSafeEqual(Buffer.from(hashed), Buffer.from(candidateHash));
}

async function loginUser(payload) {
  const { email, password } = payload;

  if (!email || !password) {
    throw createHttpError(400, "email and password are required");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const userResult = await query(
    "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
    [normalizedEmail]
  );

  const user = userResult.rows[0];

  if (!user || !verifyPassword(user.password_hash, String(password))) {
    throw createHttpError(401, "invalid credentials");
  }

  const token = crypto.randomUUID();
  await query("INSERT INTO sessions (token, user_id) VALUES ($1, $2)", [
    token,
    user.id,
  ]);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function logoutUser(req) {
  const token = getBearerToken(req);

  if (!token) {
    throw createHttpError(401, "missing bearer token");
  }

  const updateResult = await query(
    "UPDATE sessions SET revoked_at = NOW() WHERE token = $1 AND revoked_at IS NULL",
    [token]
  );

  if (updateResult.rowCount === 0) {
    throw createHttpError(401, "invalid session token");
  }
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};
