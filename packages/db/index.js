const { Pool } = require("pg");

function getConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || "5432";
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  if (!host || !user || !password || !dbName) {
    return null;
  }

  const encodedPassword = encodeURIComponent(password);
  return `postgres://${user}:${encodedPassword}@${host}:${port}/${dbName}`;
}

const connectionString = getConnectionString();

if (!connectionString) {
  throw new Error(
    "Set DATABASE_URL or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME for @epm/db"
  );
}

const pool = new Pool({ connectionString });

async function query(text, params) {
  return pool.query(text, params);
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      bio TEXT,
      contact_info TEXT,
      photo_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_info TEXT;");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;");

  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMPTZ
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS pitches (
      id UUID PRIMARY KEY,
      entrepreneur_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      startup_name TEXT NOT NULL,
      business_overview TEXT NOT NULL,
      problem_solution TEXT NOT NULL,
      market_opportunity TEXT NOT NULL,
      funding_request NUMERIC(14,2) NOT NULL,
      supporting_media JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function checkDbHealth() {
  await query("SELECT 1");
}

module.exports = {
  query,
  initDb,
  checkDbHealth,
};
