import fs from "fs";
import path from "path";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ImageSlider from "@/components/ImageSlider";
import IntroSection from "@/components/IntroSection";
import Schedule from "@/components/Schedule";
import SellerCTA from "@/components/SellerCTA";
import BoardCTA from "@/components/BoardCTA";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

function getContent() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "content.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Home() {
  const content = getContent();
  if (content?.maintenanceMode) redirect("/maintenance");

  return (
    <>
      <Navbar />

      {/* SECTION 1 — 소개 + 이미지 슬라이더 */}
      <section style={{ paddingTop: "100px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <ImageSlider slides={content?.slides} />
        <IntroSection intro={content?.intro} />
      </section>

      {/* SECTION 2 — 월간 일정 + 추첨 이벤트 */}
      <Schedule
        schedule={content?.schedule}
        prizes={content?.prizes}
        prizeImageUrl={content?.prizeImageUrl}
      />

      {/* SECTION 3 — 셀러 모집 */}
      <SellerCTA seller={content?.seller} />

      {/* SECTION 4 — 게시판 홍보 */}
      <BoardCTA />

      {/* FOOTER */}
      <Footer />
    </>
  );
}
