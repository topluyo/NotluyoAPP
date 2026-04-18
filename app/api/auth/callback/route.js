import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForUser, upsertUser, createToken } from "@/lib/auth";

// NOT: Edge Runtime KULLANMA - Cloudflare, Vercel Edge IP'lerini 403 ile engelliyor.
// Serverless runtime + browser-like headers (exchangeCodeForUser içinde) kullanılıyor.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://notluyo-app.vercel.app";

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/login?error=missing_params`);
  }

  // State doğrulama
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
  }

  // State cookie'yi temizle
  cookieStore.delete("oauth_state");

  try {
    // Token exchange - browser-like headers ile Cloudflare bypass
    const tokenData = await exchangeCodeForUser(code);

    if (tokenData.status !== "success" || !tokenData.user) {
      return NextResponse.redirect(
        `${appUrl}/login?error=auth_failed&message=${encodeURIComponent(
          tokenData.message || "Authentication failed"
        )}`
      );
    }

    // Kullanıcıyı DB'ye kaydet/güncelle ve JWT oluştur
    const user = await upsertUser(tokenData.user);
    const token = await createToken(user);

    // Auth cookie set et ve dashboard'a yönlendir
    const response = NextResponse.redirect(new URL("/dashboard", appUrl));
    response.cookies.set("nightbord_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 gün
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[OAuth Callback] Hata:", error);
    return NextResponse.redirect(
      `${appUrl}/login?error=server_error&message=${encodeURIComponent(error.message)}`
    );
  }
}
