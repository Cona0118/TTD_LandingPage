import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "ttd-secret-key-change-in-production";
const COOKIE_NAME = "ttd_admin_session";

function generateToken() {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update("ttd-admin-authenticated")
    .digest("hex");
}

/* GET: 인증 상태 확인 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return Response.json({ authenticated: token === generateToken() });
}

/* POST: 로그인 */
export async function POST(request) {
  const { password } = await request.json();

  if (password !== ADMIN_PASSWORD) {
    return Response.json(
      { success: false, message: "비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, generateToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24시간
    path: "/",
  });

  return Response.json({ success: true });
}

/* DELETE: 로그아웃 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return Response.json({ success: true });
}
