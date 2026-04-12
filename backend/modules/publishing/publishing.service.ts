import { prisma } from "../../utils/prisma.js";
import { composioService } from "../../integrations/composioService.js";

export class PublishingService {
  async publishPendingPosts() {
    const pendingPosts = await prisma.post.findMany({
      where: {
        status: "READY_TO_PUBLISH",
        publishedAt: null
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
        const response = await composioService.publishMedia(
          post.contentItem.mediaUrl,
          caption,
          platform
        );

        if (response.success) {
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: "PUBLISHED",
              publishedAt: new Date(),
              externalLink: `https://${platform}.com/posts/${post.id}` 
            }
          });
          results.push({ id: post.id, status: "SUCCESS" });
        }
      } catch (error) {
        console.error(`Error publishing post ${post.id}:`, error);
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "FAILED" }
        });
        results.push({ id: post.id, status: "FAILED", error: (error as Error).message });
      }
    }

    return results;
  }
}

export const publishingService = new PublishingService();
