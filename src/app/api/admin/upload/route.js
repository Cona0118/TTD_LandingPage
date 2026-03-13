import { cookies } from "next/headers";
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

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];
const VIDEO_EXTS = ["mp4", "webm", "mov"];
const ALL_EXTS = [...IMAGE_EXTS, ...VIDEO_EXTS];

const MIME_MAP = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
};

// Supabase 공개 URL에서 스토리지 경로 추출
function extractStoragePath(publicUrl) {
  // URL 형식: https://<project>.supabase.co/storage/v1/object/public/images/<path>
  const marker = "/object/public/images/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

// 파일 삭제
export async function DELETE(request) {
  if (!(await isAuthenticated())) {
    return Response.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ success: false, message: "Supabase가 설정되지 않았습니다." }, { status: 500 });
  }

  try {
    const { urls } = await request.json(); // urls: string[]
    const paths = (urls || [])
      .map(extractStoragePath)
      .filter(Boolean);

    if (paths.length === 0) {
      return Response.json({ success: true, deleted: 0 });
    }

    const { error } = await supabase.storage.from("images").remove(paths);
    if (error) {
      console.error("Storage delete error:", error);
      return Response.json({ success: false, message: error.message }, { status: 500 });
    }

    return Response.json({ success: true, deleted: paths.length });
  } catch (err) {
    console.error("Delete error:", err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// 서명된 업로드 URL 발급 (파일은 브라우저에서 직접 Supabase로 업로드)
export async function POST(request) {
  if (!(await isAuthenticated())) {
    return Response.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ success: false, message: "Supabase가 설정되지 않았습니다." }, { status: 500 });
  }

  try {
    const { fileName, customName } = await request.json();

    if (!fileName) {
      return Response.json({ success: false, message: "파일명이 없습니다." }, { status: 400 });
    }

    const ext = fileName.split(".").pop().toLowerCase();
    if (!ALL_EXTS.includes(ext)) {
      return Response.json(
        { success: false, message: "jpg, png, gif, webp, mp4, webm, mov 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    const mediaType = VIDEO_EXTS.includes(ext) ? "video" : "image";
    const contentType = MIME_MAP[ext];
    const filePath = customName
      ? `admin/${customName}.${ext}`
      : `admin/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;

    // customName이 있으면 기존 파일 덮어쓰기 (upsert)
    if (customName) {
      await supabase.storage.from("images").remove([filePath]);
    }

    const { data: signedData, error: signError } = await supabase.storage
      .from("images")
      .createSignedUploadUrl(filePath);

    if (signError) {
      console.error("Signed URL error:", signError);
      return Response.json({ success: false, message: `서명 URL 생성 실패: ${signError.message}` }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath);

    return Response.json({
      success: true,
      signedUrl: signedData.signedUrl,
      publicUrl: urlData.publicUrl,
      contentType,
      mediaType,
    });
  } catch (err) {
    console.error("Upload prepare error:", err);
    return Response.json({ success: false, message: `오류: ${err.message}` }, { status: 500 });
  }
}
