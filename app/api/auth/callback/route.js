import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForUser,
  upsertUser,
  createToken,
  setAuthCookie,
} from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/login?error=missing_params`);
  }

  // Verify state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
  }

  // Clear state cookie
  cookieStore.delete("oauth_state");

  try {
    // Exchange code for user data
    const response = await exchangeCodeForUser(code);

    if (response.status !== "success" || !response.user) {
      return NextResponse.redirect(
        `${appUrl}/login?error=auth_failed&message=${encodeURIComponent(response.message || "Authentication failed")}`
      );
    }

    // Upsert user in our database
    const user = await upsertUser(response.user);

    // Create JWT and set cookie
    const token = await createToken(user);
    await setAuthCookie(token);

    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${appUrl}/login?error=server_error&message=${encodeURIComponent(error.message)}`
    );
  }
}
