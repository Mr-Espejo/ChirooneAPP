import { schedules } from "@trigger.dev/sdk/v3";
import { BlitzCreativeWeekUseCase } from "../modules/ideation/blitzCreativeWeek.usecase.js";
import { getAiContextPath } from "../utils/paths.js";

// Run every Monday at 9:00 AM
export const weeklyIdeationTask = schedules.task({
  id: "weekly-ideation-task",
  cron: "0 9 * * 1", // Monday at 9AM
  run: async (payload, io, ctx) => {
    console.log("[Trigger] Running Weekly Ideation Task...");
    
    const brandDnaPath = getAiContextPath("brandDna.json");
    console.log(`[Trigger] Using brandDna from: ${brandDnaPath}`);
    const brandDna = JSON.parse(fs.readFileSync(brandDnaPath, "utf-8"));
    
    // Check if this is a dry-run/test coming from a manual trigger payload
    const isDryRun = payload?.externalPayload?.dryRun === true;

    const useCase = new BlitzCreativeWeekUseCase();
    const result = await useCase.execute("my-company-id", brandDna, { dryRun: isDryRun });
    
    console.log("[Trigger] Weekly Ideation result:", result);
    return result;
  },
});
