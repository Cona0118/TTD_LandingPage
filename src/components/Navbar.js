"use client";

import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [kakaoUrl, setKakaoUrl] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/navbar")
      .then((r) => r.json())
      .then((d) => { if (d.kakaoUrl) setKakaoUrl(d.kakaoUrl); })
      .catch(() => {});
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <a href="/" className={styles.logo}>
        ㅌㅌㄷ<span>.</span>
      </a>
      <div className={styles.links}>
        <a href="#schedule">일정</a>
        <a href="#seller">셀러 모집</a>
        <a href="/board">게시판</a>
        {kakaoUrl && (
          <a
            href={kakaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cta}
          >
            카카오톡 문의
          </a>
        )}
      </div>
    </nav>
  );
}
