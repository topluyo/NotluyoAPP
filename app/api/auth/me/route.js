import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserStorageUsage } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let storage = null;
  try {
    storage = await getUserStorageUsage(user.id);
  } catch {
    // DB might not be initialized yet
  }

  return NextResponse.json({ user, storage });
}
