import { task, wait } from "@trigger.dev/sdk/v3";
import { prisma } from "../utils/prisma.js";
import "dotenv/config";

const API_KEY = process.env.KIEAI_API_KEY;

export const generateVideoTask = task({
  id: "generate-video-task",
  maxDuration: 600, 
  concurrencyLimit: 1, 
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
    console.log(`[Video] Task created: ${taskId}`);

    let isCompleted = false;
    let attempts = 0;

    while (!isCompleted && attempts < 30) {
      attempts++;
      await wait.for({ seconds: 40 });

      const statusResp = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: { 
          "Authorization": `Bearer ${API_KEY}`
        }
      });
      const statusData = await statusResp.json() as any;
      const status = (statusData.data?.status || statusData.msg || "").toUpperCase();

      if (status === "SUCCESS" || status === "COMPLETED") {
        const videoUrl = statusData.data?.videos?.[0]?.url || statusData.data?.url || statusData.data?.videoUrl;
        if (videoUrl) {
          console.log(`[Video] SUCCESS! URL: ${videoUrl}`);
          
          await prisma.contentItem.update({
            where: { id: postId },
            data: {
              mediaUrl: videoUrl, // Final video URL
              posts: {
                updateMany: {
                  data: { status: "READY_TO_PUBLISH" }
                }
              }
            }
          });
          
          isCompleted = true;
          return { success: true, videoUrl };
        }
      }
      console.log(`[Video] Status: ${status} (Attempt ${attempts}/30)`);
    }

    throw new Error(`Video task ${taskId} timed out.`);
  },
});
