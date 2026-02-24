# ㅌㅌㄷ — 벼룩시장 웹사이트

매달 셋째 주 토요일에 열리는 벼룩시장 **ㅌㅌㄷ**의 공식 웹사이트입니다.

---

## 기술 스택

| 구분       | 기술                    |
|-----------|------------------------|
| 프레임워크  | Next.js 14 (App Router) |
| 스타일링    | CSS Modules             |
| DB / 인증  | Supabase (게시판용)      |
| 배포       | Vercel (권장)           |

---

## 프로젝트 구조

```
ttd-project/
├── public/
│   └── images/          ← 슬라이더·경품 이미지
├── src/
│   ├── app/
│   │   ├── layout.js    ← 루트 레이아웃 (메타·폰트)
│   │   ├── page.js      ← 랜딩 페이지
│   │   └── board/
│   │       └── page.js  ← 게시판 페이지
│   ├── components/
│   │   ├── Navbar.js / .module.css
│   │   ├── ImageSlider.js / .module.css
│   │   ├── IntroSection.js / .module.css
│   │   ├── Schedule.js / .module.css
│   │   ├── SellerCTA.js / .module.css
│   │   └── Footer.js / .module.css
│   ├── lib/
│   │   └── supabase.js  ← Supabase 클라이언트
│   └── styles/
│       └── globals.css   ← 전역 스타일·변수
├── .env.local.example    ← 환경변수 예시
├── next.config.js
├── jsconfig.json
└── package.json
```

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

### 3. 이미지 교체

`public/images/` 폴더에 이미지를 넣고,
`src/components/ImageSlider.js` 의 `slides` 배열에서 경로를 수정하세요.

```js
const slides = [
  { id: 1, src: "/images/slide-1.jpg", alt: "이벤트 현장" },
  { id: 2, src: "/images/slide-2.jpg", alt: "셀러 부스" },
  // ...
];
```

---

## 게시판 활성화 (Supabase)

### 1. Supabase 프로젝트 생성

https://supabase.com 에서 무료 프로젝트를 생성합니다.

### 2. 테이블 생성

Supabase SQL Editor에서 아래를 실행합니다:

```sql
CREATE TABLE posts (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  author     TEXT NOT NULL DEFAULT '익명',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Anyone can insert"
  ON posts FOR INSERT WITH CHECK (true);
```

### 3. 환경변수 설정

`.env.local.example` 을 `.env.local` 로 복사한 뒤 값을 입력합니다:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. 코드 활성화

`src/app/board/page.js` 에서 주석 처리된 Supabase 코드를 활성화하고,
더미 데이터 관련 코드를 제거합니다.

---

## 배포 (Vercel)

### 1. GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-repo.git
git push -u origin main
```

### 2. Vercel 연결

1. https://vercel.com 에서 GitHub 저장소를 import
2. Environment Variables에 Supabase 키 입력
3. Deploy!

### 3. 도메인 연결

Vercel 대시보드 → Settings → Domains → 커스텀 도메인 추가
→ 도메인 업체에서 CNAME / A 레코드 설정

---

## 수정 가이드

| 수정 내용              | 파일 위치                           |
|-----------------------|------------------------------------|
| 슬라이더 이미지         | `src/components/ImageSlider.js`    |
| 소개 텍스트            | `src/components/IntroSection.js`    |
| 일정 (날짜/장소)       | `src/components/Schedule.js`        |
| 경품 목록              | `src/components/Schedule.js`        |
| 카카오톡 채널 URL      | `src/components/SellerCTA.js`       |
| 색상/폰트 등 전역 스타일 | `src/styles/globals.css`           |
| OG 메타태그            | `src/app/layout.js`                |
