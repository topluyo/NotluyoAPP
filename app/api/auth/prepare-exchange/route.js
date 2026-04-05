import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST /api/auth/prepare-exchange
// Validates state, returns form data for client-side token exchange
export async function POST(request) {
  const { code, state } = await request.json();

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  // Verify state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  // Clear state cookie
  cookieStore.delete("oauth_state");

  // Build form data for the token exchange
  const formData = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.REDIRECT_URI,
    client_id: process.env.APP_ID,
    client_secret: process.env.APP_KEY,
  }).toString();

  return NextResponse.json({ formData });
}
