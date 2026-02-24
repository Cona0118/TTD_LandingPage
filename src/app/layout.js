import "@/styles/globals.css";

export const metadata = {
  title: "TTD",
  description:
    "쓸모를 나누고, 취향을 발견하는 작지만 특별한 벼룩시장. 매달 셋째 주 토요일.",
  openGraph: {
    title: "ㅌㅌㄷ — 벼룩시장",
    description: "쓸모를 나누고, 취향을 발견하는 작지만 특별한 벼룩시장",
    type: "website",
    locale: "ko_KR",
    /* url: "https://yourdomain.com", */
    /* images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }], */
  },
  icons: {
    icon: "/images/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
