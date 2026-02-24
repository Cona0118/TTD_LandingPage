import { getContent } from "@/lib/getContent";

export async function GET() {
  try {
    const data = await getContent();
    return Response.json({ paused: !!data?.boardPaused });
  } catch {
    return Response.json({ paused: false });
  }
}
