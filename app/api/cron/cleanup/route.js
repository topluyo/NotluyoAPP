import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET /api/cron/cleanup - Delete expired shared temp bords
// Called by Vercel Cron every 6 hours
export async function GET(request) {
  // Verify cron secret if needed (Vercel sends Authorization header)
  const sql = getDb();

  const deleted = await sql`
    DELETE FROM shared_temp_bords 
    WHERE expires_at < NOW()
    RETURNING id
  `;

  return NextResponse.json({
    success: true,
    deleted: deleted.length,
    timestamp: new Date().toISOString(),
  });
}
