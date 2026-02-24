import { getContent } from "@/lib/getContent";

export async function GET() {
  try {
    const data = await getContent();
    return Response.json({
      kakaoUrl: data?.navbarKakaoUrl || "",
      instagramUrl: data?.instagramUrl || "",
    });
  } catch {
    return Response.json({ kakaoUrl: "", instagramUrl: "" });
  }
}
