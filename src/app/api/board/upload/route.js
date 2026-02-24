import crypto from "crypto";
import { supabase } from "@/lib/supabase";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  if (!supabase) {
    return Response.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: "파일 크기는 5MB 이하만 가능합니다." }, { status: 400 });
    }

    const ext = file.name.split(".").pop().toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "gif", "webp"];
    if (!allowed.includes(ext)) {
      return Response.json(
        { error: "jpg, png, gif, webp 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    const filePath = `board/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return Response.json({ error: "업로드에 실패했습니다." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    return Response.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json({ error: "업로드에 실패했습니다." }, { status: 500 });
  }
}
