import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "ttd-secret-key-change-in-production";
const COOKIE_NAME = "ttd_admin_session";
const CONTENT_PATH = path.join(process.cwd(), "src", "data", "content.json");

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update("ttd-admin-authenticated")
    .digest("hex");
  return token === expected;
}

/* GET: 콘텐츠 불러오기 */
export async function GET() {
  if (!(await isAuthenticated())) {
    return Response.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const raw = fs.readFileSync(CONTENT_PATH, "utf-8");
    return Response.json({ success: true, data: JSON.parse(raw) });
  } catch {
    return Response.json(
      { success: false, message: "콘텐츠를 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}

/* PUT: 콘텐츠 저장 */
export async function PUT(request) {
  if (!(await isAuthenticated())) {
    return Response.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    fs.writeFileSync(CONTENT_PATH, JSON.stringify(body, null, 2), "utf-8");
    revalidatePath("/");
    return Response.json({ success: true });
  } catch {
    return Response.json(
      { success: false, message: "저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
