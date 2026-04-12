import {
  publishingService
} from "../../../../../chunk-JVYM3NH3.mjs";
import "../../../../../chunk-5447UIJE.mjs";
import {
  logger,
  schedules_exports
} from "../../../../../chunk-SG4VSQCZ.mjs";
import "../../../../../chunk-G2LACVNK.mjs";
import "../../../../../chunk-ZHBVPOXT.mjs";
import "../../../../../chunk-ZQY6LADE.mjs";
import {
  __name,
  init_esm
} from "../../../../../chunk-5A2LE32G.mjs";

// triggers/publishingCron.ts
init_esm();
var dailyPublishingTask = schedules_exports.task({
  id: "daily-publishing-task",
  cron: "0 */4 * * *",
  run: /* @__PURE__ */ __name(async (payload, io, ctx) => {
    logger.info("Starting Daily Publishing Task", { payload });
    const isDryRun = payload?.externalPayload?.dryRun === true;
    if (isDryRun) {
      logger.warn("Running in DRY_RUN mode. No real posts will be published.");
    }
    const results = await publishingService.publishPendingPosts({ dryRun: isDryRun });
    logger.info("Publishing task completed.", { results });
    return results;
  }, "run")
});
export {
  dailyPublishingTask
};
//# sourceMappingURL=publishingCron.mjs.map
