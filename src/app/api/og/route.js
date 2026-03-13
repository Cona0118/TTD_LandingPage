import { ImageResponse } from "next/og";
import { getContent } from "@/lib/getContent";

export const runtime = "edge";

export async function GET() {
  const content = await getContent();
  const firstSlide = content?.slides?.[0];
  const imageUrl = firstSlide?.mobileUrl || firstSlide?.imageUrl;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <div
            style={{
              color: "#fff",
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            ㅌㅌㄷ - Trainers Trading Day
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
