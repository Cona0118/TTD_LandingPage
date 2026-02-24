"use client";

import { useEffect, useState } from "react";
import styles from "./Footer.module.css";

export default function Footer() {
  const [kakaoUrl, setKakaoUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  useEffect(() => {
    fetch("/api/navbar")
      .then((r) => r.json())
      .then((d) => {
        if (d.kakaoUrl) setKakaoUrl(d.kakaoUrl);
        if (d.instagramUrl) setInstagramUrl(d.instagramUrl);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.logo}>
        ㅌㅌㄷ<span>.</span>
      </div>
      <div className={styles.text}>© 2026 ㅌㅌㄷ. All rights reserved.</div>
      <div className={styles.links}>
        {instagramUrl && (
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        )}
        {kakaoUrl && (
          <a href={kakaoUrl} target="_blank" rel="noopener noreferrer">
            카카오톡 채널
          </a>
        )}
      </div>
    </footer>
  );
}
