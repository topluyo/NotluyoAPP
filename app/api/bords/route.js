import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, getUserStorageUsage, SINGLE_UPLOAD_LIMIT, STORAGE_LIMIT } from "@/lib/db";

// GET /api/bords - List user's saved bords
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();
  const bords = await sql`
    SELECT id, slug, name, description, keywords, visible, created_at, updated_at,
           pg_column_size(data) as data_size
    FROM saved_bords 
    WHERE user_id = ${user.id} 
    ORDER BY updated_at DESC
  `;

  const storage = await getUserStorageUsage(user.id);

  return NextResponse.json({ bords, storage });
}

// POST /api/bords - Create a new saved bord
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, name, description, keywords, data, visible } = body;

  if (!slug || !name) {
    return NextResponse.json(
      { error: "slug and name are required" },
      { status: 400 }
    );
  }

  // Check single upload size
  const dataStr = JSON.stringify(data || {});
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

  const sql = getDb();

  // Check slug uniqueness for this user
  const existing = await sql`
    SELECT id FROM saved_bords WHERE user_id = ${user.id} AND slug = ${slug}
  `;
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "A bord with this slug already exists" },
      { status: 409 }
    );
  }

  const defaultData = {
    about: {
      title: name,
      description: description || "",
      authors: [{ name: user.name, id: user.id, nick: user.nick }],
      keywords: keywords ? keywords.split(",").map((k) => k.trim()) : [],
    },
    options: { theme: "black", color: 1, stroke: 12, version: "1.1.0" },
    camera: { s: 10, x: 0, y: 0 },
    layers: {
      space: [{ name: "Main", drawings: [], medias: [], id: 1 }],
      bord: [{ name: "Main", drawings: [], id: 1 }],
    },
  };

  const bordData = data || defaultData;

  const result = await sql`
    INSERT INTO saved_bords (user_id, slug, name, description, keywords, data, visible)
    VALUES (${user.id}, ${slug}, ${name}, ${description || ""}, ${keywords || ""}, ${JSON.stringify(bordData)}, ${visible || 0})
    RETURNING id, slug, name, description, keywords, visible, created_at, updated_at
  `;

  const updatedStorage = await getUserStorageUsage(user.id);

  return NextResponse.json({ bord: result[0], storage: updatedStorage }, { status: 201 });
}
