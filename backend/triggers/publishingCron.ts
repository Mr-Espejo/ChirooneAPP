import { schedules, logger } from "@trigger.dev/sdk/v3";
import { publishingService } from "../modules/publishing/publishing.service.js";

export const dailyPublishingTask = schedules.task({
  id: "daily-publishing-task",
  cron: "0 */4 * * *",
  run: async (payload, io, ctx) => {
    logger.info("Starting Daily Publishing Task", { payload });
    
    const isDryRun = payload?.externalPayload?.dryRun === true;
    
    if (isDryRun) {
      logger.warn("Running in DRY_RUN mode. No real posts will be published.");
    }

    const results = await publishingService.publishPendingPosts({ dryRun: isDryRun });
    
    logger.info("Publishing task completed.", { results });
    return results;
  },
});
