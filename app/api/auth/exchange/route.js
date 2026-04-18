import { NextResponse } from "next/server";
import { upsertUser, createToken } from "@/lib/auth";

// POST /api/auth/exchange
// Client'tan sadece code alır, geri kalan her şeyi server-side yapar.
// client_secret hiçbir zaman tarayıcıya gitmez.
export async function POST(request) {
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // Server-side token exchange — secret güvende
  const tokenUrl = "https://topluyo.com/!pass/token";
  const formData = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.REDIRECT_URI,
    client_id: process.env.APP_ID,
    client_secret: process.env.APP_KEY,
  });

  let tokenData;
  try {
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
        "Origin": "https://topluyo.com",
        "Referer": "https://topluyo.com/",
      },
      body: formData.toString(),
    });

    const text = await tokenRes.text();
    console.log("[exchange] topluyo response:", tokenRes.status, text.substring(0, 200));

    try {
      tokenData = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: `Topluyo geçersiz yanıt (${tokenRes.status})` },
        { status: 502 }
      );
    }
  } catch (err) {
    return NextResponse.json({ error: "Topluyo bağlantı hatası: " + err.message }, { status: 502 });
  }

  if (tokenData.status !== "success" || !tokenData.user) {
    return NextResponse.json(
      { error: tokenData.message || "Kimlik doğrulama başarısız" },
      { status: 401 }
    );
  }

  // Kullanıcıyı DB'ye kaydet/güncelle
  let user;
  try {
    user = await upsertUser(tokenData.user);
  } catch (err) {
    return NextResponse.json({ error: "Kullanıcı kaydedilemedi: " + err.message }, { status: 500 });
  }

  // JWT oluştur ve cookie olarak set et
  const token = await createToken(user);

  const response = NextResponse.json({ success: true });
  response.cookies.set("nightbord_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 gün
    path: "/",
  });

  return response;
}
