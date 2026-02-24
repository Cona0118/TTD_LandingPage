"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "../board.module.css";
import { useMaintenanceCheck } from "@/hooks/useMaintenanceCheck";

export default function WritePage() {
  const router = useRouter();
  useMaintenanceCheck();
  const [form, setForm] = useState({ author: "", password: "", title: "", content: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paused, setPaused] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("/api/board/status")
      .then((r) => r.json())
      .then((d) => { if (d.paused) setPaused(true); })
      .catch(() => {});
  }, []);

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be selected again
    e.target.value = "";

    if (file.size > 5 * 1024 * 1024) {
      setError("이미지 크기는 5MB 이하만 가능합니다.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/board/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        // Insert markdown image at cursor position
        const textarea = textareaRef.current;
        const cursorPos = textarea?.selectionStart ?? form.content.length;
        const before = form.content.slice(0, cursorPos);
        const after = form.content.slice(cursorPos);
        const imageMarkdown = `![이미지](${data.url})`;
        const newContent = before + (before && !before.endsWith("\n") ? "\n" : "") + imageMarkdown + (after && !after.startsWith("\n") ? "\n" : "") + after;

        setForm({ ...form, content: newContent });
      } else {
        setError(data.error || "이미지 업로드에 실패했습니다.");
      }
    } catch {
      setError("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.password.trim()) {
      setError("제목, 내용, 비밀번호는 필수 입력 항목입니다.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/board/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          author: form.author || "익명",
          password: form.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/board/${data.id}`);
      } else {
        setError(data.error || "글 작성에 실패했습니다.");
      }
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.label}>Community</div>
          <h1 className={styles.title}>글쓰기</h1>
        </div>

        {paused ? (
          <div className={styles.pausedNotice}>
            <p>현재 게시판 작성이 일시 중지되었습니다.</p>
            <button className={styles.cancelBtn} onClick={() => router.push("/board")}>
              목록으로
            </button>
          </div>
        ) : (
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <input
              className={styles.input}
              placeholder="닉네임 (기본값: 익명)"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
            <input
              className={styles.input}
              type="password"
              placeholder="비밀번호 (수정·삭제 시 필요)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <input
            className={styles.input}
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder="내용을 입력하세요"
            rows={10}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
          <div className={styles.imageUploadRow}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className={styles.imageUploadBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "업로드 중..." : "이미지 첨부"}
            </button>
            <span className={styles.imageUploadHint}>JPG, PNG, GIF, WEBP (최대 5MB)</span>
          </div>
          {error && <p className={styles.errorMsg}>{error}</p>}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => router.push("/board")}
            >
              취소
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading || uploading}>
              {loading ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </form>
        )}
      </main>

      <Footer />
    </>
  );
}
