import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// /api/auth/callback — Topluyo'nun redirect ettiği endpoint
// State doğrular, sonra client-side exchange için /auth/callback sayfasına yönlendirir.
// NOT: Server-side token exchange Cloudflare tarafından 403 ile engelleniyor.
// Tarayıcının kendi CF cookie'si olduğundan client-side yapılması gerekiyor.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://notluyo-app.vercel.app";

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/login?error=missing_params`);
  }

  // State doğrulama — server-side yapılıyor (güvenli)
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
  }

  // State cookie'yi temizle
  cookieStore.delete("oauth_state");

  // Token exchange'i client-side yapması için /auth/callback sayfasına yönlendir
  // code ve state'i query param olarak taşı (güvenli: tek kullanımlık, kısa ömürlü)
  const clientCallbackUrl = new URL("/auth/callback", appUrl);
  clientCallbackUrl.searchParams.set("code", code);
  clientCallbackUrl.searchParams.set("state", state);

  return NextResponse.redirect(clientCallbackUrl);
}
