import { cookies } from "next/headers";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "ttd-secret-key-change-in-production";
const COOKIE_NAME = "ttd_admin_session";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update("ttd-admin-authenticated")
    .digest("hex");
  return token === expected;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/* GET: 특정 게시글의 댓글 목록 (hidden 포함) */
export async function GET(request) {
  if (!(await isAuthenticated())) {
    return Response.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("post_id");

  if (!postId) {
    return Response.json({ success: false, message: "post_id가 필요합니다." }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return Response.json({ success: false, message: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, author, content, created_at, parent_id, hidden")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }

  return Response.json({ success: true, comments: data });
}
