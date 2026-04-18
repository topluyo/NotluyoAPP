import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nightbord-default-secret"
);
const COOKIE_NAME = "nightbord_token";
const TOKEN_EXPIRY = "30d";

/**
 * Create a JWT token for a user
 */
export async function createToken(user) {
  return await new SignJWT({
    userId: user.id,
    topluyoId: user.topluyo_id,
    nick: user.nick,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get current logged-in user from cookies
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    const sql = getDb();
    const users = await sql`
      SELECT id, topluyo_id, nick, name, avatar_url, created_at 
      FROM users WHERE id = ${payload.userId}
    `;

    return users[0] || null;
  } catch (error) {
    // DB might not be initialized yet
    console.error("getCurrentUser error (DB may not be initialized):", error.message);
    return null;
  }
}

/**
 * Set auth cookie with JWT token
 */
export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

/**
 * Remove auth cookie
 */
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Upsert user from Topluyo OAuth response
 */
export async function upsertUser(topluyoUser) {
  const sql = getDb();

  // TopluyoPASS backend returns: { user_id, user_name, user_nick, user_image }
  // Normalize field names to handle both formats
  const userId   = String(topluyoUser.user_id   ?? topluyoUser.id   ?? "");
  const userName = topluyoUser.user_name  ?? topluyoUser.name  ?? "";
  const userNick = topluyoUser.user_nick  ?? topluyoUser.nick  ?? "";
  const userImage = topluyoUser.user_image ?? topluyoUser.avatar ?? "";

  if (!userId) throw new Error("Invalid user data: missing user_id");

  const existing = await sql`
    SELECT * FROM users WHERE topluyo_id = ${userId}
  `;

  if (existing.length > 0) {
    await sql`
      UPDATE users 
      SET name = ${userName || existing[0].name},
          nick = ${userNick || existing[0].nick},
          avatar_url = ${userImage || existing[0].avatar_url}
      WHERE topluyo_id = ${userId}
    `;
    const updated = await sql`
      SELECT * FROM users WHERE topluyo_id = ${userId}
    `;
    return updated[0];
  }

  const inserted = await sql`
    INSERT INTO users (topluyo_id, nick, name, avatar_url)
    VALUES (${userId}, ${userNick || 'user_' + userId}, ${userName}, ${userImage})
    RETURNING *
  `;

  return inserted[0];
}

/**
 * Build Topluyo OAuth authorization URL
 */
export function buildAuthUrl(state) {
  const appId = process.env.APP_ID;
  const redirectUri = process.env.REDIRECT_URI;

  return (
    `https://topluyo.com/!pass/request` +
    `?response_type=code` +
    `&client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent("openid profile")}` +
    `&state=${state}`
  );
}

/**
 * Exchange authorization code for user data
 */
export async function exchangeCodeForUser(code) {
  const tokenUrl = "https://topluyo.com/!pass/token";

  const data = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.REDIRECT_URI,
    client_id: process.env.APP_ID,
    client_secret: process.env.APP_KEY,
  });

  console.log("[OAuth] Token exchange request:", {
    url: tokenUrl,
    redirect_uri: process.env.REDIRECT_URI,
    client_id: process.env.APP_ID,
    client_secret: process.env.APP_KEY ? "***set***" : "***MISSING***",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Origin": "https://topluyo.com",
      "Referer": "https://topluyo.com/",
    },
    body: data.toString(),
  });

  const responseText = await response.text();
  console.log("[OAuth] Token exchange response:", response.status, responseText.substring(0, 500));

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`Token exchange failed (${response.status}): ${responseText}`);
  }

  if (!response.ok && !result.user) {
    throw new Error(`Token exchange failed (${response.status}): ${JSON.stringify(result)}`);
  }

  return result;
}

