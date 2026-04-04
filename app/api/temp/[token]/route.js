import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, getUserStorageUsage, SINGLE_UPLOAD_LIMIT, STORAGE_LIMIT } from "@/lib/db";

// GET /api/temp/:token - Get shared temp bord data
export async function GET(request, { params }) {
  const { token } = await params;
  const sql = getDb();

  const bords = await sql`
    SELECT stb.*, u.nick as user_nick, u.name as user_name
    FROM shared_temp_bords stb
    JOIN users u ON u.id = stb.user_id
    WHERE stb.share_token = ${token}
    AND stb.expires_at > NOW()
  `;

  if (bords.length === 0) {
    return NextResponse.json(
      { error: "Shared bord not found or expired" },
      { status: 404 }
    );
  }

  const bord = bords[0];
  const user = await getCurrentUser();
  const isOwner = user && user.id === bord.user_id;

  return NextResponse.json({
    bord: {
      id: bord.id,
      name: bord.name,
      data: bord.data,
      user_nick: bord.user_nick,
      user_name: bord.user_name,
      expires_at: bord.expires_at,
      isOwner,
      mode: isOwner ? "edit" : "view",
    },
  });
}

// PUT /api/temp/:token - Update shared temp bord (resets expiry)
export async function PUT(request, { params }) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();

  // Check ownership
  const bords = await sql`
    SELECT * FROM shared_temp_bords 
    WHERE share_token = ${token} AND user_id = ${user.id} AND expires_at > NOW()
  `;

  if (bords.length === 0) {
    return NextResponse.json(
      { error: "Shared bord not found, expired, or access denied" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { data, name } = body;

  if (data !== undefined) {
    const dataStr = JSON.stringify(data);
    const dataSize = new TextEncoder().encode(dataStr).length;

    if (dataSize > SINGLE_UPLOAD_LIMIT) {
      return NextResponse.json(
        { error: "Data exceeds 1MB upload limit", size: dataSize, limit: SINGLE_UPLOAD_LIMIT },
        { status: 413 }
      );
    }

    // Check total storage (subtract current, add new)
    const storage = await getUserStorageUsage(user.id);
    const currentSize = await sql`
      SELECT pg_column_size(data) as size FROM shared_temp_bords WHERE share_token = ${token}
    `;
    const oldSize = parseInt(currentSize[0]?.size || 0);
    const newTotal = storage.total - oldSize + dataSize;

    if (newTotal > STORAGE_LIMIT) {
      return NextResponse.json(
        { error: "Storage limit exceeded (1.5MB)", storage: { ...storage, total: newTotal } },
        { status: 413 }
      );
    }

    // Reset expiry to 7 days from now
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await sql`
      UPDATE shared_temp_bords 
      SET data = ${JSON.stringify(data)},
          name = ${name ?? bords[0].name},
          expires_at = ${newExpiry},
          updated_at = NOW()
      WHERE share_token = ${token} AND user_id = ${user.id}
    `;
  }

  const updated = await sql`
    SELECT id, share_token, name, expires_at, updated_at
    FROM shared_temp_bords WHERE share_token = ${token}
  `;

  const storage = await getUserStorageUsage(user.id);

  return NextResponse.json({ shared: updated[0], storage });
}

// DELETE /api/temp/:token - Delete shared temp bord
export async function DELETE(request, { params }) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();
  const result = await sql`
    DELETE FROM shared_temp_bords 
    WHERE share_token = ${token} AND user_id = ${user.id}
    RETURNING id
  `;

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
  }

  const storage = await getUserStorageUsage(user.id);
  return NextResponse.json({ success: true, storage });
}
