import { schedules } from "@trigger.dev/sdk/v3";
import { publishingService } from "../modules/publishing/publishing.service.js";

export const dailyPublishingTask = schedules.task({
  id: "daily-publishing-task",
  cron: "0 */4 * * *",
  run: async (payload, io, ctx) => {
    const results = await publishingService.publishPendingPosts();
    return results;
  },
});
