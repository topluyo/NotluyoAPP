import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, getUserStorageUsage, SINGLE_UPLOAD_LIMIT, STORAGE_LIMIT } from "@/lib/db";

// GET /api/bords/:id - Get bord details + data
export async function GET(request, { params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const sql = getDb();

  const bords = await sql`
    SELECT b.*, u.nick as user_nick, u.name as user_name
    FROM saved_bords b
    JOIN users u ON u.id = b.user_id
    WHERE b.id = ${id}
  `;

  if (bords.length === 0) {
    return NextResponse.json({ error: "Bord not found" }, { status: 404 });
  }

  const bord = bords[0];

  // Check access
  const isOwner = user && user.id === bord.user_id;
  if (!isOwner && bord.visible === 0) {
    return NextResponse.json({ error: "This bord is private" }, { status: 403 });
  }

  return NextResponse.json({
    bord: {
      ...bord,
      isOwner,
      mode: isOwner ? "edit" : "view",
    },
  });
}

// PUT /api/bords/:id - Update bord
export async function PUT(request, { params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();

  // Check ownership
  const bords = await sql`
    SELECT * FROM saved_bords WHERE id = ${id} AND user_id = ${user.id}
  `;
  if (bords.length === 0) {
    return NextResponse.json({ error: "Bord not found or access denied" }, { status: 404 });
  }

  const body = await request.json();
  const { name, slug, description, keywords, data, visible } = body;

  // If data is being updated, check size limits
  if (data !== undefined) {
    const dataStr = JSON.stringify(data);
    const dataSize = new TextEncoder().encode(dataStr).length;

    if (dataSize > SINGLE_UPLOAD_LIMIT) {
      return NextResponse.json(
        { error: "Data exceeds 1MB upload limit", size: dataSize, limit: SINGLE_UPLOAD_LIMIT },
        { status: 413 }
      );
    }

    // Check total storage (subtract current bord size, add new size)
    const storage = await getUserStorageUsage(user.id);
    const currentBordSize = await sql`
      SELECT pg_column_size(data) as size FROM saved_bords WHERE id = ${id}
    `;
    const currentSize = parseInt(currentBordSize[0]?.size || 0);
    const newTotal = storage.total - currentSize + dataSize;

    if (newTotal > STORAGE_LIMIT) {
      return NextResponse.json(
        { error: "Storage limit exceeded (1.5MB)", storage: { ...storage, total: newTotal } },
        { status: 413 }
      );
    }

    await sql`
      UPDATE saved_bords 
      SET data = ${JSON.stringify(data)}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
    `;
  }

  // Update metadata if provided
  if (name !== undefined || slug !== undefined || description !== undefined || keywords !== undefined || visible !== undefined) {
    const current = bords[0];
    await sql`
      UPDATE saved_bords 
      SET name = ${name ?? current.name},
          slug = ${slug ?? current.slug},
          description = ${description ?? current.description},
          keywords = ${keywords ?? current.keywords},
          visible = ${visible ?? current.visible},
          updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
    `;
  }

  const updated = await sql`
    SELECT id, slug, name, description, keywords, visible, created_at, updated_at
    FROM saved_bords WHERE id = ${id}
  `;

  const storage = await getUserStorageUsage(user.id);

  return NextResponse.json({ bord: updated[0], storage });
}

// DELETE /api/bords/:id - Delete bord
export async function DELETE(request, { params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();
  const result = await sql`
    DELETE FROM saved_bords WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id
  `;

  if (result.length === 0) {
    return NextResponse.json({ error: "Bord not found or access denied" }, { status: 404 });
  }

  const storage = await getUserStorageUsage(user.id);

  return NextResponse.json({ success: true, storage });
}
