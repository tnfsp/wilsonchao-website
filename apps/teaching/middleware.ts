import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/teaching/auth") return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const authCookie = request.cookies.get("teaching-auth");
  if (authCookie?.value === "1") return NextResponse.next();

  const authUrl = new URL("/teaching/auth", request.url);
  return NextResponse.redirect(authUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|avatar.png).*)"],
};
