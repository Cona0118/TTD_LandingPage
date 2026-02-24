"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "../../board.module.css";
import { useMaintenanceCheck } from "@/hooks/useMaintenanceCheck";

export default function EditPage() {
  const router = useRouter();
  useMaintenanceCheck();
  const { id } = useParams();

  const [form, setForm] = useState({ author: "", title: "", content: "" });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!id) return;

    const storedPw = sessionStorage.getItem(`post_${id}_pw`);
    if (!storedPw) {
      router.replace(`/board/${id}`);
      return;
    }
    setPassword(storedPw);
    fetchPost();
  }, [id]);

  async function fetchPost() {
    try {
      const res = await fetch(`/api/board/posts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setForm({ author: data.author, title: data.title, content: data.content });
      } else {
        router.replace("/board");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

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
    if (!form.title.trim() || !form.content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/board/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          author: form.author || "익명",
          password,
        }),
      });
      if (res.ok) {
        sessionStorage.removeItem(`post_${id}_pw`);
        router.push(`/board/${id}`);
      } else {
        const data = await res.json();
        setError(data.error || "수정에 실패했습니다.");
      }
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <p className={styles.empty}>불러오는 중...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.label}>Community</div>
          <h1 className={styles.title}>글 수정</h1>
        </div>

        <form className={styles.formCard} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            placeholder="닉네임 (기본값: 익명)"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
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
              onClick={() => router.push(`/board/${id}`)}
            >
              취소
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting || uploading}>
              {submitting ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </>
  );
}
