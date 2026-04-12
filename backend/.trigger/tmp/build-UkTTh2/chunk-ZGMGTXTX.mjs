import {
  prisma,
  task,
  wait
} from "./chunk-JT7ZX6SE.mjs";
import {
  __name,
  init_esm
} from "./chunk-5A2LE32G.mjs";

// triggers/videoGeneration.ts
init_esm();
var API_KEY = process.env.KIEAI_API_KEY;
var generateVideoTask = task({
  id: "generate-video-task",
  maxDuration: 600,
  concurrencyLimit: 1,
  run: /* @__PURE__ */ __name(async (payload) => {
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
          prompt,
          mode: "normal",
          duration: "6",
          resolution: "480p",
          aspect_ratio: "9:16"
        }
      })
    });
    const result = await resp.json();
    if (result.code !== 200) {
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
      const statusData = await statusResp.json();
      const status = statusData.data?.status || statusData.msg;
      if (status === "SUCCESS" || status === "COMPLETED") {
        const videoUrl = statusData.data?.videos?.[0]?.url || statusData.data?.url;
        if (videoUrl) {
          console.log(`[Video] SUCCESS! URL: ${videoUrl}`);
          await prisma.contentItem.update({
            where: { id: postId },
            data: {
              mediaUrl: videoUrl,
              // Final video URL
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
  }, "run")
});

export {
  generateVideoTask
};
//# sourceMappingURL=chunk-ZGMGTXTX.mjs.map
