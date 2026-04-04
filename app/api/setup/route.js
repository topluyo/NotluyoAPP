import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

// POST /api/setup - Initialize database tables
// Call this once to set up the database
export async function POST() {
  try {
    await initDb();
    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (error) {
    console.error("DB init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize database", details: error.message },
      { status: 500 }
    );
  }
}
