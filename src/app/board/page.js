"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./board.module.css";
import { useMaintenanceCheck } from "@/hooks/useMaintenanceCheck";

export default function BoardPage() {
  const router = useRouter();
  useMaintenanceCheck();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/board/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    return dateStr?.slice(0, 10) || "";
  }

  return (
    <>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.label}>Community</div>
          <h1 className={styles.title}>게시판</h1>
          <p className={styles.subtitle}>ㅌㅌㄷ 소식과 이야기를 나눠보세요.</p>
        </div>

        <div className={styles.toolbar}>
          <span className={styles.count}>전체 {posts.length}건</span>
          <button
            className={styles.writeBtn}
            onClick={() => router.push("/board/write")}
          >
            글쓰기
          </button>
        </div>

        {loading ? (
          <p className={styles.empty}>불러오는 중...</p>
        ) : posts.length === 0 ? (
          <p className={styles.empty}>
            아직 게시글이 없습니다. 첫 글을 작성해보세요!
          </p>
        ) : (
          (() => {
            const totalPages = Math.ceil(posts.length / PAGE_SIZE);
            const currentPosts = posts.slice(
              (currentPage - 1) * PAGE_SIZE,
              currentPage * PAGE_SIZE,
            );
            return (
              <>
                <div className={styles.list}>
                  {currentPosts.map((post, i) => {
                    const globalIndex = (currentPage - 1) * PAGE_SIZE + i;
                    return (
                      <div
                        key={post.id}
                        className={styles.row}
                        onClick={() => router.push(`/board/${post.id}`)}
                      >
                        <span className={styles.rowNum}>
                          {posts.length - globalIndex}
                        </span>
                        <span className={styles.rowTitle}>
                          {post.title}
                          {post.comment_count > 0 && (
                            <span className={styles.commentBadge}>
                              [{post.comment_count}]
                            </span>
                          )}
                        </span>
                        <span className={styles.rowAuthor}>{post.author}</span>
                        <span className={styles.rowDate}>
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageBtn}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      이전
                    </button>
                    {Array.from(
                      { length: totalPages },
                      (_, idx) => idx + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ""}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className={styles.pageBtn}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            );
          })()
        )}
      </main>

      <Footer />
    </>
  );
}
