import { getContent } from "@/lib/getContent";

export async function GET() {
  try {
    const data = await getContent();
    return Response.json({ maintenanceMode: !!data?.maintenanceMode });
  } catch {
    return Response.json({ maintenanceMode: false });
  }
}
