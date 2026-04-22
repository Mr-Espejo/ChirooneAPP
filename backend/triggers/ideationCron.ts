import { schedules } from "@trigger.dev/sdk/v3";
import { BlitzCreativeWeekUseCase } from "../modules/ideation/blitzCreativeWeek.usecase.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Run every Monday at 9:00 AM
export const weeklyIdeationTask = schedules.task({
  id: "weekly-ideation-task",
  cron: "0 9 * * 1", // Monday at 9AM
  run: async (payload, io, ctx) => {
    console.log("[Trigger] Running Weekly Ideation Task...");
    
    const path1 = path.join(__dirname, "../../../ai-context/brandDna.json"); // if in dist/triggers
    const path2 = path.join(__dirname, "../../ai-context/brandDna.json"); // if in src/triggers or via tsx
    const path3 = path.join(process.cwd(), "../ai-context/brandDna.json"); // relative to backend process

    let brandDnaPath = path1;
    if (fs.existsSync(path2)) brandDnaPath = path2;
    else if (fs.existsSync(path3)) brandDnaPath = path3;

    if (!fs.existsSync(brandDnaPath)) {
      console.error(`[Trigger] brandDna.json not found in paths: ${path1}, ${path2}, ${path3}`);
      throw new Error(`brandDna.json not found`);
    }
    const brandDna = JSON.parse(fs.readFileSync(brandDnaPath, "utf-8"));
    
    // Check if this is a dry-run/test coming from a manual trigger payload
    const isDryRun = payload?.externalPayload?.dryRun === true;

    const useCase = new BlitzCreativeWeekUseCase();
    const result = await useCase.execute("my-company-id", brandDna, { dryRun: isDryRun });
    
    console.log("[Trigger] Weekly Ideation result:", result);
    return result;
  },
});
