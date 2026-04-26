import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/clerk", "/teaching/auth"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (pathname.startsWith("/clerk/")) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const authCookie = request.cookies.get("teaching-auth");
  if (authCookie?.value === "1") return NextResponse.next();

  const authUrl = new URL("/teaching/auth", request.url);
  return NextResponse.redirect(authUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|avatar.png).*)"],
};
