import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth";

export async function GET() {
  await removeAuthCookie();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(`${appUrl}/login`);
}

export async function POST() {
  await removeAuthCookie();
  return NextResponse.json({ success: true });
}
