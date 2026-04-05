import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Run on Edge Runtime - different infrastructure/IPs than Serverless
export const runtime = "edge";

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
    // Token exchange - from Edge Runtime
    const tokenUrl = "https://topluyo.com/!pass/token";
    const formData = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REDIRECT_URI,
      client_id: process.env.APP_ID,
      client_secret: process.env.APP_KEY,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: formData.toString(),
    });

    const responseText = await tokenRes.text();
    console.log("[OAuth Edge]", tokenRes.status, responseText.substring(0, 300));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.redirect(
        `${appUrl}/login?error=invalid_response&status=${tokenRes.status}`
      );
    }

    if (data.status !== "success" || !data.user) {
      return NextResponse.redirect(
        `${appUrl}/login?error=auth_failed&message=${encodeURIComponent(data.message || "Failed")}`
      );
    }

    // Success - call finalize to create user + JWT
    const finalizeRes = await fetch(`${appUrl}/api/auth/finalize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": request.headers.get("cookie") || "",
      },
      body: JSON.stringify({ user: data.user }),
    });

    const finalizeData = await finalizeRes.json();

    // Build redirect response and forward Set-Cookie headers from finalize  
    const redirectUrl = new URL("/dashboard", appUrl);
    const response = NextResponse.redirect(redirectUrl);

    // Forward all set-cookie headers from finalize response
    const setCookies = finalizeRes.headers.getSetCookie?.() || [];
    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie);
    }

    // Fallback: if getSetCookie is not available
    if (setCookies.length === 0) {
      const setCookieHeader = finalizeRes.headers.get("set-cookie");
      if (setCookieHeader) {
        response.headers.set("set-cookie", setCookieHeader);
      }
    }

    return response;
  } catch (error) {
    console.error("OAuth Edge error:", error);
    return NextResponse.redirect(
      `${appUrl}/login?error=server_error&message=${encodeURIComponent(error.message)}`
    );
  }
}
