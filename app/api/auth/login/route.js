import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/auth";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  // Store state in cookie for verification on callback
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  const authUrl = buildAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
