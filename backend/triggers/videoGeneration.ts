import { task, wait } from "@trigger.dev/sdk/v3";
import { prisma } from "../utils/prisma.js";
import "dotenv/config";

const API_KEY = process.env.KIEAI_API_KEY;

export const generateVideoTask = task({
  id: "generate-video-task",
  maxDuration: 600, 
  concurrencyLimit: 5, 
  run: async (payload: { postId: string; imageUrl: string; prompt: string; companyId: string }) => {
    const { postId, imageUrl, prompt, companyId } = payload;
    
    const resp = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-imagine/image-to-video",
        webhookUrl: process.env.WEBHOOK_URL || "https://tu-api.com/webhook/kieai",
        input: {
          image_urls: [imageUrl],
          prompt: prompt,
          mode: "normal",
          duration: "30",
          resolution: "720p",
          aspect_ratio: "9:16"
        }
      })
    });

    const result = await resp.json() as any;
    
    if (result.code !== 200) {
      console.error(`[Video] Safety or API Error: ${result.msg}`);
      await prisma.post.updateMany({
        where: { contentItemId: postId },
        data: { status: "FAILED_BY_SAFETY" }
      });
      throw new Error(`Kie.ai Error: ${result.msg}`);
    }

    const taskId = result.data.taskId;
    console.log(`[Video] Task created: ${taskId}. Delegating completion to Webhook.`);

    await prisma.contentItem.update({
      where: { id: postId },
      data: {
        videoTaskId: taskId,
        posts: { updateMany: { where: {}, data: { status: "GENERATING_VIDEO" } } }
      }
    });

    return { success: true, taskId, message: "Task delegated to Webhook" };
  },
});
