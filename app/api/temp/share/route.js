import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, getUserStorageUsage, SINGLE_UPLOAD_LIMIT, STORAGE_LIMIT } from "@/lib/db";
import crypto from "crypto";

// POST /api/temp/share - Share a temp bord (save to DB with 7-day TTL)
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { name, data } = body;

  if (!data) {
    return NextResponse.json({ error: "data is required" }, { status: 400 });
  }

  // Check single upload size
  const dataStr = JSON.stringify(data);
  const dataSize = new TextEncoder().encode(dataStr).length;

  if (dataSize > SINGLE_UPLOAD_LIMIT) {
    return NextResponse.json(
      { error: "Data exceeds 1MB upload limit", size: dataSize, limit: SINGLE_UPLOAD_LIMIT },
      { status: 413 }
    );
  }

  // Check total storage
  const storage = await getUserStorageUsage(user.id);
  if (storage.total + dataSize > STORAGE_LIMIT) {
    return NextResponse.json(
      { error: "Storage limit exceeded (1.5MB)", storage },
      { status: 413 }
    );
  }

  const shareToken = crypto.randomBytes(32).toString("hex");
  const sql = getDb();

  // 7 days from now
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const result = await sql`
    INSERT INTO shared_temp_bords (user_id, share_token, name, data, expires_at)
    VALUES (${user.id}, ${shareToken}, ${name || "Untitled"}, ${JSON.stringify(data)}, ${expiresAt})
    RETURNING id, share_token, name, expires_at, created_at
  `;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const updatedStorage = await getUserStorageUsage(user.id);

  return NextResponse.json({
    shared: result[0],
    shareUrl: `${appUrl}/shared/${shareToken}`,
    storage: updatedStorage,
  }, { status: 201 });
}
