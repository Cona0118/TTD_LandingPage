"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "../board.module.css";
import { useMaintenanceCheck } from "@/hooks/useMaintenanceCheck";

export default function PostDetailPage() {
  const router = useRouter();
  useMaintenanceCheck();
  const { id } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Comment form
  const [commentForm, setCommentForm] = useState({ author: "", content: "", password: "" });
  const [commentError, setCommentError] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // Reply state
  const [replyTo, setReplyTo] = useState(null); // comment id being replied to
  const [replyForm, setReplyForm] = useState({ author: "", content: "", password: "" });
  const [replyError, setReplyError] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // Comment edit state
  const [editingComment, setEditingComment] = useState(null); // comment id being edited
  const [editForm, setEditForm] = useState({ content: "", password: "" });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Comment delete modal
  const [deletingComment, setDeletingComment] = useState(null); // comment id being deleted
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Post password modal: null | "edit" | "delete"
  const [modal, setModal] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Board paused
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
    }
    fetch("/api/board/status")
      .then((r) => r.json())
      .then((d) => { if (d.paused) setPaused(true); })
      .catch(() => {});
  }, [id]);

  async function fetchPost() {
    try {
      const res = await fetch(`/api/board/posts/${id}`);
      if (res.status === 404) {
        setNotFound(true);
      } else if (res.ok) {
        const data = await res.json();
        setPost(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments() {
    const res = await fetch(`/api/board/posts/${id}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  // Build comment tree: top-level + replies grouped
  function buildCommentTree(flatComments) {
    const topLevel = [];
    const childrenMap = {};

    for (const c of flatComments) {
      if (c.parent_id) {
        if (!childrenMap[c.parent_id]) childrenMap[c.parent_id] = [];
        childrenMap[c.parent_id].push(c);
      } else {
        topLevel.push(c);
      }
    }

    return { topLevel, childrenMap };
  }

  // --- Comment CRUD handlers ---

  async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!commentForm.content.trim()) {
      setCommentError("댓글 내용을 입력해주세요.");
      return;
    }
    if (!commentForm.password.trim()) {
      setCommentError("비밀번호를 입력해주세요.");
      return;
    }
    setCommentLoading(true);
    setCommentError("");
    try {
      const res = await fetch(`/api/board/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: commentForm.author || "익명",
          content: commentForm.content,
          password: commentForm.password,
        }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setCommentForm({ author: "", content: "", password: "" });
      } else {
        const data = await res.json();
        setCommentError(data.error || "댓글 등록에 실패했습니다.");
      }
    } catch {
      setCommentError("오류가 발생했습니다.");
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleReplySubmit(e) {
    e.preventDefault();
    if (!replyForm.content.trim()) {
      setReplyError("답글 내용을 입력해주세요.");
      return;
    }
    if (!replyForm.password.trim()) {
      setReplyError("비밀번호를 입력해주세요.");
      return;
    }
    setReplyLoading(true);
    setReplyError("");
    try {
      const res = await fetch(`/api/board/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: replyForm.author || "익명",
          content: replyForm.content,
          password: replyForm.password,
          parent_id: replyTo,
        }),
      });
      if (res.ok) {
        const newReply = await res.json();
        setComments((prev) => [...prev, newReply]);
        setReplyTo(null);
        setReplyForm({ author: "", content: "", password: "" });
      } else {
        const data = await res.json();
        setReplyError(data.error || "답글 등록에 실패했습니다.");
      }
    } catch {
      setReplyError("오류가 발생했습니다.");
    } finally {
      setReplyLoading(false);
    }
  }

  function startEdit(comment) {
    setEditingComment(comment.id);
    setEditForm({ content: comment.content, password: "" });
    setEditError("");
    // Close other interactions
    setReplyTo(null);
    setDeletingComment(null);
  }

  function cancelEdit() {
    setEditingComment(null);
    setEditForm({ content: "", password: "" });
    setEditError("");
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editForm.content.trim()) {
      setEditError("댓글 내용을 입력해주세요.");
      return;
    }
    if (!editForm.password.trim()) {
      setEditError("비밀번호를 입력해주세요.");
      return;
    }
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/board/posts/${id}/comments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment_id: editingComment,
          content: editForm.content,
          password: editForm.password,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComments((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        cancelEdit();
      } else {
        const data = await res.json();
        setEditError(data.error || "수정에 실패했습니다.");
      }
    } catch {
      setEditError("오류가 발생했습니다.");
    } finally {
      setEditLoading(false);
    }
  }

  function startDelete(commentId) {
    setDeletingComment(commentId);
    setDeletePassword("");
    setDeleteError("");
    // Close other interactions
    setEditingComment(null);
    setReplyTo(null);
  }

  function cancelDelete() {
    setDeletingComment(null);
    setDeletePassword("");
    setDeleteError("");
  }

  async function handleDeleteSubmit(e) {
    e.preventDefault();
    if (!deletePassword.trim()) {
      setDeleteError("비밀번호를 입력해주세요.");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/board/posts/${id}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment_id: deletingComment,
          password: deletePassword,
        }),
      });
      if (res.ok) {
        // Remove the deleted comment and its children
        setComments((prev) =>
          prev.filter((c) => c.id !== deletingComment && c.parent_id !== deletingComment)
        );
        cancelDelete();
      } else {
        const data = await res.json();
        setDeleteError(data.error || "삭제에 실패했습니다.");
      }
    } catch {
      setDeleteError("오류가 발생했습니다.");
    } finally {
      setDeleteLoading(false);
    }
  }

  // --- Post modal handlers ---

  function openModal(type) {
    setModal(type);
    setPasswordInput("");
    setPasswordError("");
  }

  function closeModal() {
    setModal(null);
    setPasswordInput("");
    setPasswordError("");
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError("비밀번호를 입력해주세요.");
      return;
    }
    setPasswordLoading(true);
    setPasswordError("");

    if (modal === "delete") {
      try {
        const res = await fetch(`/api/board/posts/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: passwordInput }),
        });
        if (res.ok) {
          router.push("/board");
        } else {
          const data = await res.json();
          setPasswordError(data.error || "삭제에 실패했습니다.");
        }
      } catch {
        setPasswordError("오류가 발생했습니다.");
      } finally {
        setPasswordLoading(false);
      }
    } else if (modal === "edit") {
      try {
        const res = await fetch(`/api/board/posts/${id}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: passwordInput }),
        });
        if (res.ok) {
          sessionStorage.setItem(`post_${id}_pw`, passwordInput);
          router.push(`/board/${id}/edit`);
        } else {
          const data = await res.json();
          setPasswordError(data.error || "비밀번호가 맞지 않습니다.");
        }
      } catch {
        setPasswordError("오류가 발생했습니다.");
      } finally {
        setPasswordLoading(false);
      }
    }
  }

  // --- Render helpers ---

  function renderCommentActions(comment, isReply = false) {
    return (
      <div className={styles.commentActions}>
        {!isReply && (
          <button
            className={styles.commentActionBtn}
            onClick={() => {
              setReplyTo(replyTo === comment.id ? null : comment.id);
              setEditingComment(null);
              setDeletingComment(null);
            }}
          >
            답글
          </button>
        )}
        <button
          className={styles.commentActionBtn}
          onClick={() => startEdit(comment)}
        >
          수정
        </button>
        <button
          className={`${styles.commentActionBtn} ${styles.commentDeleteBtn}`}
          onClick={() => startDelete(comment.id)}
        >
          삭제
        </button>
      </div>
    );
  }

  function renderReplyForm(parentId) {
    if (replyTo !== parentId) return null;
    return (
      <form className={styles.replyForm} onSubmit={handleReplySubmit}>
        <div className={styles.formRow}>
          <input
            className={styles.input}
            placeholder="닉네임 (기본값: 익명)"
            value={replyForm.author}
            onChange={(e) => setReplyForm({ ...replyForm, author: e.target.value })}
          />
          <input
            className={styles.input}
            type="password"
            placeholder="비밀번호 (수정·삭제 시 필요)"
            value={replyForm.password}
            onChange={(e) => setReplyForm({ ...replyForm, password: e.target.value })}
          />
        </div>
        <div className={styles.commentInputRow}>
          <textarea
            className={styles.textarea}
            placeholder="답글을 입력하세요"
            rows={2}
            value={replyForm.content}
            onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
            required
            autoFocus
          />
          <button type="submit" className={styles.submitBtn} disabled={replyLoading}>
            {replyLoading ? "등록 중..." : "등록"}
          </button>
        </div>
        {replyError && <p className={styles.errorMsg}>{replyError}</p>}
        <button
          type="button"
          className={styles.commentActionBtn}
          onClick={() => { setReplyTo(null); setReplyError(""); }}
        >
          취소
        </button>
      </form>
    );
  }

  function renderEditForm(comment) {
    if (editingComment !== comment.id) return null;
    return (
      <form className={styles.editForm} onSubmit={handleEditSubmit}>
        <textarea
          className={styles.textarea}
          rows={3}
          value={editForm.content}
          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
          required
          autoFocus
        />
        <input
          className={styles.input}
          type="password"
          placeholder="비밀번호"
          value={editForm.password}
          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
        />
        {editError && <p className={styles.errorMsg}>{editError}</p>}
        <div className={styles.editFormActions}>
          <button type="button" className={styles.cancelBtn} onClick={cancelEdit}>
            취소
          </button>
          <button type="submit" className={styles.submitBtn} disabled={editLoading}>
            {editLoading ? "수정 중..." : "수정"}
          </button>
        </div>
      </form>
    );
  }

  function renderDeleteForm(commentId) {
    if (deletingComment !== commentId) return null;
    return (
      <form className={styles.deleteForm} onSubmit={handleDeleteSubmit}>
        <p className={styles.deleteWarning}>삭제하면 복구할 수 없습니다.</p>
        <input
          className={styles.input}
          type="password"
          placeholder="비밀번호"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          autoFocus
        />
        {deleteError && <p className={styles.errorMsg}>{deleteError}</p>}
        <div className={styles.editFormActions}>
          <button type="button" className={styles.cancelBtn} onClick={cancelDelete}>
            취소
          </button>
          <button type="submit" className={`${styles.submitBtn} ${styles.deleteBtnFull}`} disabled={deleteLoading}>
            {deleteLoading ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </form>
    );
  }

  function renderComment(comment, isReply = false) {
    const isEditing = editingComment === comment.id;
    return (
      <div
        key={comment.id}
        className={`${styles.commentItem} ${isReply ? styles.replyItem : ""}`}
      >
        <div className={styles.commentMeta}>
          <span className={styles.commentAuthor}>{comment.author}</span>
          <span className={styles.commentDate}>{formatDate(comment.created_at)}</span>
        </div>
        {isEditing ? (
          renderEditForm(comment)
        ) : (
          <>
            <p className={styles.commentContent}>{comment.content}</p>
            {renderCommentActions(comment, isReply)}
            {renderDeleteForm(comment.id)}
          </>
        )}
        {!isReply && renderReplyForm(comment.id)}
      </div>
    );
  }

  // --- Main render ---

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

  if (notFound || !post) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <p className={styles.empty}>게시글을 찾을 수 없습니다.</p>
          <button className={styles.cancelBtn} onClick={() => router.push("/board")}>
            목록으로
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const { topLevel, childrenMap } = buildCommentTree(comments);
  const totalCount = comments.length;

  return (
    <>
      <Navbar />

      <main className={styles.main}>
        {/* Back button */}
        <button className={styles.backBtn} onClick={() => router.push("/board")}>
          ← 목록
        </button>

        {/* Post */}
        <article className={styles.postCard}>
          <h2 className={styles.postTitle}>{post.title}</h2>
          <div className={styles.postMeta}>
            <span>{post.author}</span>
            <span className={styles.metaDot}>·</span>
            <span>{formatDate(post.created_at)}</span>
            {post.updated_at !== post.created_at && (
              <>
                <span className={styles.metaDot}>·</span>
                <span className={styles.editedLabel}>수정됨</span>
              </>
            )}
          </div>
          <div className={styles.postContent}>
            {post.content.split(/(!\[.*?\]\(.*?\))/).map((part, i) => {
              const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
              if (match) {
                return (
                  <img
                    key={i}
                    src={match[2]}
                    alt={match[1]}
                    className={styles.postImage}
                  />
                );
              }
              return part ? <span key={i}>{part}</span> : null;
            })}
          </div>
          <div className={styles.postActions}>
            <button className={styles.actionBtn} onClick={() => openModal("edit")}>
              수정
            </button>
            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => openModal("delete")}>
              삭제
            </button>
          </div>
        </article>

        {/* Comments */}
        <section className={styles.commentSection}>
          <h3 className={styles.commentTitle}>댓글 {totalCount}개</h3>

          {totalCount > 0 && (
            <div className={styles.commentList}>
              {topLevel.map((comment) => (
                <div key={comment.id}>
                  {renderComment(comment)}
                  {/* Replies */}
                  {childrenMap[comment.id]?.map((reply) =>
                    renderComment(reply, true)
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Comment form */}
          {paused ? (
            <div className={styles.pausedNotice}>
              <p>현재 댓글 작성이 일시 중지되었습니다.</p>
            </div>
          ) : (
            <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
              <div className={styles.formRow}>
                <input
                  className={styles.input}
                  placeholder="닉네임 (기본값: 익명)"
                  value={commentForm.author}
                  onChange={(e) => setCommentForm({ ...commentForm, author: e.target.value })}
                />
                <input
                  className={styles.input}
                  type="password"
                  placeholder="비밀번호 (수정·삭제 시 필요)"
                  value={commentForm.password}
                  onChange={(e) => setCommentForm({ ...commentForm, password: e.target.value })}
                />
              </div>
              <div className={styles.commentInputRow}>
                <textarea
                  className={styles.textarea}
                  placeholder="댓글을 입력하세요"
                  rows={3}
                  value={commentForm.content}
                  onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                  required
                />
                <button type="submit" className={styles.submitBtn} disabled={commentLoading}>
                  {commentLoading ? "등록 중..." : "등록"}
                </button>
              </div>
              {commentError && <p className={styles.errorMsg}>{commentError}</p>}
            </form>
          )}
        </section>
      </main>

      {/* Post password modal */}
      {modal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {modal === "edit" ? "게시글 수정" : "게시글 삭제"}
            </h3>
            <p className={styles.modalDesc}>
              {modal === "edit"
                ? "수정하려면 비밀번호를 입력해주세요."
                : "삭제하면 복구할 수 없습니다. 비밀번호를 입력해주세요."}
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                className={styles.input}
                type="password"
                placeholder="비밀번호"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
              {passwordError && <p className={styles.errorMsg}>{passwordError}</p>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                  취소
                </button>
                <button
                  type="submit"
                  className={`${styles.submitBtn} ${modal === "delete" ? styles.deleteBtnFull : ""}`}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "처리 중..." : modal === "edit" ? "확인" : "삭제"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
