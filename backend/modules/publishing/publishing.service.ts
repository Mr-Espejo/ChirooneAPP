import { prisma } from "../../utils/prisma.js";
import { composioService } from "../../integrations/composioService.js";

export class PublishingService {
  async publishPendingPosts(options: { dryRun?: boolean; itemId?: string } = {}) {
    const pendingPosts = await prisma.post.findMany({
      where: {
        status: options.itemId ? { in: ["READY_TO_PUBLISH", "FAILED"] } : "READY_TO_PUBLISH",
        ...(options.itemId ? { contentItemId: options.itemId } : {}),
        // Si es un override manual (itemId provisto), ignoramos la fecha de schedule
        ...(options.itemId ? {} : {
          OR: [
            { publishedAt: null },
            { publishedAt: { lte: new Date() } }
          ]
        })
      },
      include: {
        contentItem: true
      }
    });

    if (pendingPosts.length === 0) {
      return { message: "No pending posts found" };
    }

    const results = [];

    for (const post of pendingPosts) {
      try {
        if (!post.contentItem.mediaUrl) {
          throw new Error(`Post ${post.id} missing media URL`);
        }

        const caption = `${post.contentItem.hook}\n\n${post.contentItem.body}\n\n${post.contentItem.cta}`;
        
        const platform = post.platform.toLowerCase() as 'instagram' | 'tiktok' | 'youtube' | 'facebook';
        
        if (options.dryRun) {
          console.log(`[DryRun] Would publish post ${post.id} to ${platform}`);
          results.push({ id: post.id, status: "DRY_RUN", platform });
          continue;
        }

        // PRIORITIZE VIDEO OVER IMAGE
        const finalMediaUrl = post.contentItem.videoUrl || post.contentItem.mediaUrl;
        
        if (!finalMediaUrl) {
          throw new Error(`Post ${post.id} missing media URL`);
        }

        const response = await composioService.publishMedia(
          finalMediaUrl,
          caption,
          platform
        );

        if (response.success) {
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: "PUBLISHED",
              publishedAt: new Date(),
              externalLink: `https://${platform}.com/posts/${post.id}`,
              lastError: null 
            }
          });
          results.push({ id: post.id, status: "SUCCESS" });
        }
      } catch (error) {
        console.error(`Error publishing post ${post.id}:`, error);
        if (!options.dryRun) {
          await prisma.post.update({
            where: { id: post.id },
            data: { 
              status: "FAILED",
              lastError: (error as Error).message
            }
          });
        }
        results.push({ id: post.id, status: "FAILED", error: (error as Error).message });
      }
    }

    return results;
  }
}

export const publishingService = new PublishingService();
