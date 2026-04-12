import {
  prisma
} from "../../../../../chunk-5447UIJE.mjs";
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

// triggers/watchdogCron.ts
init_esm();
var generationWatchdog = schedules_exports.task({
  id: "generation-watchdog",
  cron: "0 1 * * *",
  // Once per day at 1:00 AM
  run: /* @__PURE__ */ __name(async (payload, io, ctx) => {
    logger.info("Watchdog: Checking for stuck generations...");
    const stuckItems = await prisma.contentItem.findMany({
      where: {
        OR: [
          { AND: [{ mediaUrl: null }, { imageTaskId: { not: null } }] },
          { AND: [{ videoUrl: null }, { videoTaskId: { not: null } }] }
        ]
      }
    });
    logger.info(`Watchdog: Found ${stuckItems.length} potentially stuck items. Crons will naturally pick them up.`);
    return {
      mediaReconditioned: stuckMedia.length
    };
  }, "run")
});
export {
  generationWatchdog
};
//# sourceMappingURL=watchdogCron.mjs.map
