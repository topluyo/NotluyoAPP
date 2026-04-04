import { neon } from "@neondatabase/serverless";

let _sql = null;

export function getDb() {
  if (!_sql) {
    if (!process.env.POSTGRES_URL) {
      throw new Error("POSTGRES_URL environment variable is not set");
    }
    _sql = neon(process.env.POSTGRES_URL);
  }
  return _sql;
}

/**
 * Initialize database tables
 */
export async function initDb() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      topluyo_id VARCHAR(255) UNIQUE NOT NULL,
      nick VARCHAR(100) NOT NULL,
      name VARCHAR(255),
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS saved_bords (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      slug VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      keywords TEXT DEFAULT '',
      data JSONB NOT NULL,
      visible SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, slug)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shared_temp_bords (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      share_token VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(255) DEFAULT 'Untitled',
      data JSONB NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

// Storage limit constants
export const STORAGE_LIMIT = 1.5 * 1024 * 1024; // 1.5 MB
export const STORAGE_WARNING = 1 * 1024 * 1024;  // 1 MB
export const SINGLE_UPLOAD_LIMIT = 1 * 1024 * 1024; // 1 MB

/**
 * Get user's total storage usage in bytes
 */
export async function getUserStorageUsage(userId) {
  const sql = getDb();
  
  const savedResult = await sql`
    SELECT COALESCE(SUM(pg_column_size(data)), 0) as total_size
    FROM saved_bords WHERE user_id = ${userId}
  `;
  
  const tempResult = await sql`
    SELECT COALESCE(SUM(pg_column_size(data)), 0) as total_size
    FROM shared_temp_bords WHERE user_id = ${userId}
  `;
  
  const savedSize = parseInt(savedResult[0]?.total_size || 0);
  const tempSize = parseInt(tempResult[0]?.total_size || 0);
  
  return {
    saved: savedSize,
    temp: tempSize,
    total: savedSize + tempSize,
    limit: STORAGE_LIMIT,
    warning: STORAGE_WARNING,
    isWarning: (savedSize + tempSize) >= STORAGE_WARNING,
    isExceeded: (savedSize + tempSize) >= STORAGE_LIMIT,
  };
}
