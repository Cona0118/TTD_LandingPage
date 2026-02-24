import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function GET(request, { params }) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, content, author, created_at, updated_at, hidden")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  if (data.hidden) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const { hidden, ...postData } = data;
  return NextResponse.json(postData);
}

export async function PUT(request, { params }) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }

  const { id } = await params;
  const body = await request.json();
  const { title, content, author, password } = body;

  if (!title?.trim() || !content?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "제목, 내용, 비밀번호는 필수 입력 항목입니다." }, { status: 400 });
  }

  // Verify password
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("password_hash")
    .eq("id", id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  if (post.password_hash !== hashPassword(password)) {
    return NextResponse.json({ error: "비밀번호가 맞지 않습니다." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("posts")
    .update({
      title: title.trim(),
      content: content.trim(),
      author: author?.trim() || "익명",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, title, content, author, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }

  const { id } = await params;
  const body = await request.json();
  const { password } = body;

  if (!password?.trim()) {
    return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  // Verify password
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("password_hash")
    .eq("id", id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  if (post.password_hash !== hashPassword(password)) {
    return NextResponse.json({ error: "비밀번호가 맞지 않습니다." }, { status: 401 });
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
