import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const CONTENT_PATH = path.join(process.cwd(), "src", "data", "content.json");

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function isBoardPaused() {
  try {
    const raw = fs.readFileSync(CONTENT_PATH, "utf-8");
    return !!JSON.parse(raw).boardPaused;
  } catch {
    return false;
  }
}

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, author, created_at, updated_at")
    .eq("hidden", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add comment count
  const postsWithCount = await Promise.all(
    data.map(async (post) => {
      const { count } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id)
        .eq("hidden", false);
      return { ...post, comment_count: count || 0 };
    })
  );

  return NextResponse.json(postsWithCount);
}

export async function POST(request) {
  if (isBoardPaused()) {
    return NextResponse.json({ error: "현재 게시판 작성이 일시 중지되었습니다." }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }

  const body = await request.json();
  const { title, content, author, password } = body;

  if (!title?.trim() || !content?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "제목, 내용, 비밀번호는 필수 입력 항목입니다." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        title: title.trim(),
        content: content.trim(),
        author: author?.trim() || "익명",
        password_hash: hashPassword(password),
      },
    ])
    .select("id, title, author, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
