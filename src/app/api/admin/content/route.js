import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "ttd-secret-key-change-in-production";
const COOKIE_NAME = "ttd_admin_session";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

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

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ success: false, message: "Supabase가 설정되지 않았습니다." }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from("site_content")
      .select("data")
      .eq("id", 1)
      .single();

    if (error) throw error;
    return Response.json({ success: true, data: data.data });
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

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ success: false, message: "Supabase가 설정되지 않았습니다." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: 1, data: body, updated_at: new Date().toISOString() });

    if (error) throw error;
    revalidatePath("/");
    return Response.json({ success: true });
  } catch {
    return Response.json(
      { success: false, message: "저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
