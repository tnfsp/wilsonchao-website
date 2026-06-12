import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // 密碼必須由環境變數提供；未設定時一律拒絕，避免任何寫死的預設密碼
  const teachingPassword = process.env.TEACHING_PASSWORD;
  if (!teachingPassword) {
    console.error("TEACHING_PASSWORD is not set; rejecting all logins.");
    return NextResponse.json({ error: "auth not configured" }, { status: 503 });
  }

  try {
    const { password } = await request.json();

    if (password === teachingPassword) {
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
