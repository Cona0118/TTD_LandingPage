import fs from "fs";
import path from "path";

const CONTENT_PATH = path.join(process.cwd(), "src", "data", "content.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(CONTENT_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Response.json({ maintenanceMode: !!data.maintenanceMode });
  } catch {
    return Response.json({ maintenanceMode: false });
  }
}
