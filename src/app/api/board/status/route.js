import fs from "fs";
import path from "path";

const CONTENT_PATH = path.join(process.cwd(), "src", "data", "content.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(CONTENT_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Response.json({ paused: !!data.boardPaused });
  } catch {
    return Response.json({ paused: false });
  }
}
