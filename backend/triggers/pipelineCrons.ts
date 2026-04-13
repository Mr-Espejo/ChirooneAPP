import { schedules, logger } from "@trigger.dev/sdk/v3";
import "dotenv/config";

const API_KEY = process.env.KIEAI_API_KEY;

/**
 * CRON 1: Media Sync (Intelligent Polling with resultJson Support)
 */
export const syncMediaCron = schedules.task({
  id: "sync-media-cron",
  cron: "0,30 * * * *", 
  run: async () => {
    const { prisma } = await import("../utils/prisma.ts");
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
      const checkTask = async (taskId: string) => {
        try {
          const resp = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
            headers: { "Authorization": `Bearer ${API_KEY}` }
          });
          const result = await resp.json() as any;
          const status = (result.data?.status || result.msg || "").toUpperCase();
          
          if (status === "SUCCESS" || status === "COMPLETED") {
            let url = result.data?.url;

            // NEW: Parse resultJson string if available
            if (result.data?.resultJson) {
              try {
                const parsed = JSON.parse(result.data.resultJson);
                url = parsed.resultUrls?.[0] || parsed.videoUrl || parsed.url || url;
              } catch (e) {
                logger.warn(`Failed to parse resultJson for ${item.id}`);
              }
            }

            // Fallback to other known paths
            url = url || result.data?.videos?.[0]?.url || result.data?.images?.[0]?.url;

            if (!url) {
                logger.warn(`Task ${taskId} reported success but no URL found!`, { result });
                return;
            }

            const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(url);
            
            await prisma.contentItem.update({
              where: { id: item.id },
              data: { 
                ...(isVideo ? { videoUrl: url, videoTaskId: null } : { mediaUrl: url, imageTaskId: null }),
                posts: { 
                  updateMany: { 
                    data: { status: isVideo ? "READY_TO_PUBLISH" : "WAITING_FOR_VIDEO" } 
                  } 
                }
              }
            });
            logger.info(`[Sync] ${isVideo ? 'VIDEO' : 'IMAGE'} Ready for ${item.id}: ${url}`);
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
          logger.error(`[Sync] Request Error for ${item.id}`, { error: (e as any).message });
        }
      };

      if (!item.mediaUrl && item.imageTaskId) await checkTask(item.imageTaskId);
      if (!item.videoUrl && item.videoTaskId) await checkTask(item.videoTaskId);
    }
  }
});

/**
 * CRON 2: Video Generation (Promotes Image -> Video)
 */
export const startVideoGenerationCron = schedules.task({
  id: "start-video-generation-cron",
  cron: "15,45 * * * *",
  run: async () => {
    const { prisma } = await import("../utils/prisma.ts");
    const { kieaiService } = await import("../integrations/kieaiService.ts");

    const item = await prisma.contentItem.findFirst({
      where: {
        mediaUrl: { not: null },
        videoUrl: null,
        videoTaskId: null,
        posts: { some: { status: "WAITING_FOR_VIDEO" } }
      }
    });

    if (!item) return;

    try {
      const videoTask = await kieaiService.createVideoFromImage(
        item.mediaUrl!,
        item.storyboard || item.hook || "Cinematic transition"
      );

      if (videoTask?.taskId) {
        await prisma.contentItem.update({
          where: { id: item.id },
          data: {
            videoTaskId: videoTask.taskId,
            posts: { updateMany: { data: { status: "GENERATING_VIDEO" } } }
          }
        });
        logger.info(`Pipeline: Started Video for ${item.id}`, { taskId: videoTask.taskId });
      } else {
        logger.warn(`Pipeline: No taskId returned for ${item.id}`, { videoTask });
      }
    } catch (e) {
      logger.error(`Pipeline: Video Generation Trigger Failed for ${item.id}`, { error: (e as any).message });
    }
  }
});

/**
 * CRON 3: High-Frequency Publishing
 */
export const highFrequencyPublishingCron = schedules.task({
  id: "high-frequency-publishing-cron",
  cron: "*/15 * * * *",
  run: async () => {
    const { publishingService } = await import("../modules/publishing/publishing.service.ts");
    logger.info("Pipeline: Checking for posts ready to go live...");
    await publishingService.publishPendingPosts();
  }
});
