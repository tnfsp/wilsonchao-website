import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/teaching", "/clerk"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path needs protection
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isProtected) return NextResponse.next();

  // Allow auth page and API
  if (pathname === "/teaching/auth") return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Check cookie
  const authCookie = request.cookies.get("teaching-auth");
  if (authCookie?.value === "1") return NextResponse.next();

  // Redirect to auth page
  const authUrl = new URL("/teaching/auth", request.url);
  return NextResponse.redirect(authUrl);
}

export const config = {
  matcher: ["/teaching/:path*", "/clerk/:path*"],
};
