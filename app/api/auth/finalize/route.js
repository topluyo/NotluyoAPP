import { NextResponse } from "next/server";
import { upsertUser, createToken, setAuthCookie } from "@/lib/auth";

// POST /api/auth/finalize
// Receives user data from client-side token exchange, creates JWT session
export async function POST(request) {
  const { user: topluyoUser } = await request.json();

  if (!topluyoUser || !topluyoUser.id) {
    return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
  }

  try {
    // Upsert user in our database
    const user = await upsertUser(topluyoUser);

    // Create JWT and set cookie
    const token = await createToken(user);
    await setAuthCookie(token);

    return NextResponse.json({ success: true, user: { id: user.id, nick: user.nick } });
  } catch (error) {
    console.error("Finalize error:", error);
    return NextResponse.json({ error: "Failed to create session: " + error.message }, { status: 500 });
  }
}
