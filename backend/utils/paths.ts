import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getAiContextPath(filename: string): string {
  if (process.env.AI_CONTEXT_DIR && fs.existsSync(path.join(process.env.AI_CONTEXT_DIR, filename))) {
    return path.join(process.env.AI_CONTEXT_DIR, filename);
  }

  if (process.env.BRAND_DNA_PATH && filename === "brandDna.json") {
     if (fs.existsSync(process.env.BRAND_DNA_PATH)) return process.env.BRAND_DNA_PATH;
  }

  const candidates = [
    // relative to this file (backend/utils/paths.ts)
    path.join(__dirname, "../ai-context", filename),
    path.join(__dirname, "../../ai-context", filename),
    path.join(__dirname, "../../../ai-context", filename),
    path.join(__dirname, "../../../../ai-context", filename),
    // relative to CWD
    path.join(process.cwd(), "ai-context", filename),
    path.join(process.cwd(), "../ai-context", filename),
    // Absolute paths (Docker common)
    path.join("/ai-context", filename),
    path.join("/app/ai-context", filename),
    // local fallback
    path.join("./ai-context", filename)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`AI Context file not found: ${filename}. Checked: ${candidates.join(", ")}`);
}
