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

// triggers/pipelineCrons.ts
init_esm();
var API_KEY = process.env.KIEAI_API_KEY;
var syncMediaCron = schedules_exports.task({
  id: "sync-media-cron",
  cron: "0,30 * * * *",
  run: /* @__PURE__ */ __name(async () => {
    const { prisma } = await import("../../../../../prisma-DD2YTJK6.mjs");
    logger.info("Pipeline: Syncing active media tasks...");
    const pendingItems = await prisma.contentItem.findMany({
      where: {
        OR: [
          { AND: [{ mediaUrl: null }, { imageTaskId: { not: null } }] },
          { AND: [{ videoUrl: null }, { videoTaskId: { not: null } }] }
        ]
      }
    });
    if (pendingItems.length === 0) return;
    for (const item of pendingItems) {
      const checkTask = /* @__PURE__ */ __name(async (taskId) => {
        try {
          const resp = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
            headers: { "Authorization": `Bearer ${API_KEY}` }
          });
          const result = await resp.json();
          const status = (result.data?.status || result.msg || "").toUpperCase();
          if (status === "SUCCESS" || status === "COMPLETED") {
            let url = result.data?.url;
            if (result.data?.resultJson) {
              try {
                const parsed = JSON.parse(result.data.resultJson);
                url = parsed.resultUrls?.[0] || parsed.videoUrl || parsed.url || url;
              } catch (e) {
                logger.warn(`Failed to parse resultJson for ${item.id}`);
              }
            }
            url = url || result.data?.videos?.[0]?.url || result.data?.images?.[0]?.url;
            if (!url) {
              logger.warn(`Task ${taskId} reported success but no URL found!`, { result });
              return;
            }
            const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(url);
            await prisma.contentItem.update({
              where: { id: item.id },
              data: {
                ...isVideo ? { videoUrl: url, videoTaskId: null } : { mediaUrl: url, imageTaskId: null },
                posts: {
                  updateMany: {
                    data: { status: isVideo ? "READY_TO_PUBLISH" : "WAITING_FOR_VIDEO" }
                  }
                }
              }
            });
            logger.info(`[Sync] ${isVideo ? "VIDEO" : "IMAGE"} Ready for ${item.id}: ${url}`);
          } else if (status === "FAILED" || status === "ERROR" || status === "INVALID") {
            const errorMsg = result.msg || result.error || "External API Failure";
            await prisma.contentItem.update({
              where: { id: item.id },
              data: { [item.videoTaskId === taskId ? "videoTaskId" : "imageTaskId"]: null }
            });
            await prisma.post.updateMany({
              where: { contentItemId: item.id },
              data: { status: "FAILED", lastError: `[Kie.ai] ${errorMsg}` }
            });
          }
        } catch (e) {
          logger.error(`[Sync] Request Error for ${item.id}`, { error: e.message });
        }
      }, "checkTask");
      if (!item.mediaUrl && item.imageTaskId) await checkTask(item.imageTaskId);
      if (!item.videoUrl && item.videoTaskId) await checkTask(item.videoTaskId);
    }
  }, "run")
});
var startVideoGenerationCron = schedules_exports.task({
  id: "start-video-generation-cron",
  cron: "15,45 * * * *",
  run: /* @__PURE__ */ __name(async () => {
    const { prisma } = await import("../../../../../prisma-DD2YTJK6.mjs");
    const { kieaiService } = await import("../../../../../kieaiService-VUOTXEWW.mjs");
    const itemsWaitingForVideo = await prisma.contentItem.findMany({
      where: {
        mediaUrl: { not: null },
        videoUrl: null,
        videoTaskId: null,
        posts: { some: { status: "WAITING_FOR_VIDEO" } }
      }
    });
    for (const item of itemsWaitingForVideo) {
      try {
        const videoTask = await kieaiService.createVideoFromImage(
          item.mediaUrl,
          item.storyboard || item.hook || "Cinematic transition"
        );
        await prisma.contentItem.update({
          where: { id: item.id },
          data: {
            videoTaskId: videoTask.taskId,
            posts: { updateMany: { data: { status: "GENERATING_VIDEO" } } }
          }
        });
        logger.info(`Pipeline: Started Video for ${item.id}`, { taskId: videoTask.taskId });
      } catch (e) {
        logger.error(`Pipeline: Video Generation Trigger Failed for ${item.id}`, { error: e.message });
      }
    }
  }, "run")
});
var highFrequencyPublishingCron = schedules_exports.task({
  id: "high-frequency-publishing-cron",
  cron: "*/15 * * * *",
  run: /* @__PURE__ */ __name(async () => {
    const { publishingService } = await import("../../../../../publishing.service-U2T7QGJM.mjs");
    logger.info("Pipeline: Checking for posts ready to go live...");
    await publishingService.publishPendingPosts();
  }, "run")
});
export {
  highFrequencyPublishingCron,
  startVideoGenerationCron,
  syncMediaCron
};
//# sourceMappingURL=pipelineCrons.mjs.map
