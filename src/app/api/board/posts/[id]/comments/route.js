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

export async function GET(request, { params }) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from("comments")
    .select("id, author, content, created_at, parent_id")
    .eq("post_id", id)
    .eq("hidden", false)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request, { params }) {
  if (isBoardPaused()) {
    return NextResponse.json({ error: "현재 게시판 작성이 일시 중지되었습니다." }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }

  const { id } = await params;
  const body = await request.json();
  const { author, content, password, parent_id } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
  }

  if (!password?.trim()) {
    return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  const insertData = {
    post_id: parseInt(id),
    author: author?.trim() || "익명",
    content: content.trim(),
    password_hash: hashPassword(password),
  };

  if (parent_id) {
    insertData.parent_id = parseInt(parent_id);
  }

  const { data, error } = await supabase
    .from("comments")
    .insert([insertData])
    .select("id, author, content, created_at, parent_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request, { params }) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }

  await params;
  const body = await request.json();
  const { comment_id, content, password } = body;

  if (!comment_id) {
    return NextResponse.json({ error: "댓글 ID가 필요합니다." }, { status: 400 });
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
  }
  if (!password?.trim()) {
    return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  const { data: comment, error: fetchError } = await supabase
    .from("comments")
    .select("password_hash")
    .eq("id", comment_id)
    .single();

  if (fetchError || !comment) {
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
  }

  if (comment.password_hash !== hashPassword(password)) {
    return NextResponse.json({ error: "비밀번호가 맞지 않습니다." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("comments")
    .update({ content: content.trim() })
    .eq("id", comment_id)
    .select("id, author, content, created_at, parent_id")
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

  await params;
  const body = await request.json();
  const { comment_id, password } = body;

  if (!comment_id) {
    return NextResponse.json({ error: "댓글 ID가 필요합니다." }, { status: 400 });
  }
  if (!password?.trim()) {
    return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  const { data: comment, error: fetchError } = await supabase
    .from("comments")
    .select("password_hash")
    .eq("id", comment_id)
    .single();

  if (fetchError || !comment) {
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
  }

  if (comment.password_hash !== hashPassword(password)) {
    return NextResponse.json({ error: "비밀번호가 맞지 않습니다." }, { status: 401 });
  }

  const { error } = await supabase.from("comments").delete().eq("id", comment_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
