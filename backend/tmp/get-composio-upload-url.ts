import "dotenv/config";
import { statSync } from "fs";
import path from "path";

const VIDEO_PATH = path.join(process.cwd(), "tmp", "chiroone-reel.mp4");
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || "";

async function tryV3Endpoints() {
  const size = statSync(VIDEO_PATH).size;
  const endpoints = [
    { url: "https://backend.composio.dev/api/v3/files/upload", body: { filename: "chiroone-reel.mp4", mimetype: "video/mp4", size } },
    { url: "https://backend.composio.dev/api/v3/storage/presign", body: { name: "chiroone-reel.mp4", contentType: "video/mp4" } },
    { url: "https://backend.composio.dev/api/v3/uploads/presigned", body: { filename: "chiroone-reel.mp4", mimeType: "video/mp4", fileSize: size } },
  ];

  for (const ep of endpoints) {
    console.log(`\nTrying: ${ep.url}`);
    const res = await fetch(ep.url, {
      method: "POST",
      headers: { "x-api-key": COMPOSIO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(ep.body),
    });
    const text = await res.text();
    console.log(`Status: ${res.status} — ${text.slice(0, 200)}`);
  }
}

tryV3Endpoints().catch(console.error);
