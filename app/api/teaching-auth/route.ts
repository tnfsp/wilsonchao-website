import { NextRequest, NextResponse } from "next/server";

const TEACHING_PASSWORD = process.env.TEACHING_PASSWORD || "840401";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password === TEACHING_PASSWORD) {
      const response = NextResponse.json({ ok: true });
      response.cookies.set("teaching-auth", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 90, // 90 days
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ error: "wrong" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
