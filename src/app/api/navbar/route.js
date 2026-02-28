import { getContent } from "@/lib/getContent";

export async function GET() {
  try {
    const data = await getContent();
    return Response.json({
      kakaoUrl: data?.navbarKakaoUrl || "",
      footerLinks: data?.footerLinks || [],
    });
  } catch {
    return Response.json({ kakaoUrl: "", footerLinks: [] });
  }
}
