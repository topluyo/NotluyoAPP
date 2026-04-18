import { NextResponse } from "next/server";

// POST /api/auth/prepare-exchange
// State zaten /api/auth/callback'te doğrulandı.
// Bu endpoint sadece token exchange için gerekli formData'yı döndürür.
// client_secret güvenli şekilde server-side'da kalır, client'a gönderilmez.
export async function POST(request) {
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // Token exchange form data'sını hazırla
  const formData = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.REDIRECT_URI,
    client_id: process.env.APP_ID,
    client_secret: process.env.APP_KEY,
  }).toString();

  return NextResponse.json({ formData });
}
