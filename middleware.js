import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Protected routes that require authentication
const protectedPaths = ["/dashboard"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check if path needs protection
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const token = request.cookies.get("nightbord_token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If logged in and visiting login page, redirect to dashboard
  if (pathname === "/login") {
    const token = request.cookies.get("nightbord_token")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
