import { schedules, logger } from "@trigger.dev/sdk/v3";
import { prisma } from "../utils/prisma.js";
import { pollMediaTask } from "./mediaPolling.js";

export const generationWatchdog = schedules.task({
  id: "generation-watchdog",
  cron: "0 1 * * *", // Once per day at 1:00 AM
  run: async (payload, io, ctx) => {
    logger.info("Watchdog: Checking for stuck generations...");

    // 1. Find items with a taskId but no URL (potentially stuck in syncing)
    const stuckItems = await prisma.contentItem.findMany({
      where: {
        OR: [
          { AND: [{ mediaUrl: null }, { imageTaskId: { not: null } }] },
          { AND: [{ videoUrl: null }, { videoTaskId: { not: null } }] }
        ]
      }
    });

    logger.info(`Watchdog: Found ${stuckItems.length} potentially stuck items. Crons will naturally pick them up.`);
    
    // The watchdog's job here is mainly reporting/logging 
    // because the new syncMediaCron runs every 30 mins and is idempotent.
    // If we wanted to re-trigger, we'd do it here, but syncMediaCron already does it.

    return { 
      mediaReconditioned: stuckMedia.length 
    };
  },
});
