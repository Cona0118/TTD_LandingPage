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

/* GET: 모든 게시글 목록 (hidden 포함) */
export async function GET() {
  if (!(await isAuthenticated())) {
    return Response.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return Response.json({ success: false, message: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, author, created_at, hidden")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }

  const postsWithCount = await Promise.all(
    posts.map(async (post) => {
      const { count } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);
      return { ...post, comment_count: count || 0 };
    })
  );

  return Response.json({ success: true, posts: postsWithCount });
}

/* PUT: 게시글/댓글 숨김 토글 */
export async function PUT(request) {
  if (!(await isAuthenticated())) {
    return Response.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return Response.json({ success: false, message: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }

  const { type, id, hidden } = await request.json();

  if (!type || !id || typeof hidden !== "boolean") {
    return Response.json({ success: false, message: "잘못된 요청입니다." }, { status: 400 });
  }

  const table = type === "post" ? "posts" : "comments";
  const { error } = await supabase
    .from(table)
    .update({ hidden })
    .eq("id", id);

  if (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
