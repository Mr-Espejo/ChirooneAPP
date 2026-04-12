import {
  generateVideoTask
} from "../../../../../chunk-I3NAH37R.mjs";
import {
  prisma
} from "../../../../../chunk-5447UIJE.mjs";
import {
  task,
  wait
} from "../../../../../chunk-SG4VSQCZ.mjs";
import "../../../../../chunk-G2LACVNK.mjs";
import "../../../../../chunk-ZHBVPOXT.mjs";
import "../../../../../chunk-ZQY6LADE.mjs";
import {
  __name,
  init_esm
} from "../../../../../chunk-5A2LE32G.mjs";

// triggers/mediaPolling.ts
init_esm();
var API_KEY = process.env.KIEAI_API_KEY;
var pollMediaTask = task({
  id: "poll-media-task",
  maxDuration: 300,
  run: /* @__PURE__ */ __name(async (payload) => {
    const { taskId, postId, companyId } = payload;
    let isCompleted = false;
    let attempts = 0;
    console.log(`[Trigger] Starting polling for Task: ${taskId}`);
    while (!isCompleted && attempts < 20) {
      attempts++;
      console.log(`[Trigger] Polling attempt ${attempts} for ${taskId}`);
      const resp = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: {
          "x-api-key": API_KEY || "",
          "Authorization": `Bearer ${API_KEY}`
        }
      });
      const result = await resp.json();
      const status = (result.data?.status || result.msg || "").toUpperCase();
      if (status === "SUCCESS" || status === "COMPLETED") {
        const imageUrl = result.data?.images?.[0]?.url || result.data?.url;
        if (imageUrl) {
          console.log(`[Trigger] Task ${taskId} COMPLETED! URL: ${imageUrl}`);
          const contentItem = await prisma.contentItem.update({
            where: { id: postId },
            data: {
              mediaUrl: imageUrl,
              externalTaskId: null,
              // Clear task ID as it's finished
              posts: {
                updateMany: {
                  where: { status: "WAITING_FOR_MEDIA" },
                  data: { status: "WAITING_FOR_VIDEO" }
                }
              }
            }
          });
          let finalVideoPrompt = contentItem.videoRequirement || contentItem.mediaRequirement;
          try {
            if (contentItem.videoRequirement && contentItem.videoRequirement.startsWith("{")) {
              const storyboard = JSON.parse(contentItem.videoRequirement);
              if (storyboard.scenes) {
                const motions = storyboard.scenes.map((s) => s.motion_intent).join(". ");
                const context = storyboard.video_context ? ` Pacing: ${storyboard.video_context.pacing}, Style: ${storyboard.video_context.camera_style}.` : "";
                finalVideoPrompt = `${motions}${context}`;
              }
            }
          } catch (e) {
            console.error("[Polling] Error parsing storyboard JSON, falling back to raw prompt");
          }
          await generateVideoTask.trigger({
            postId,
            imageUrl,
            prompt: finalVideoPrompt,
            companyId
          });
          isCompleted = true;
          return { success: true, imageUrl };
        }
      }
      console.log(`[Trigger] Task ${taskId} is ${status}. waiting 30s...`);
      await wait.for({ seconds: 30 });
    }
    throw new Error(`Task ${taskId} timed out.`);
  }, "run")
});
export {
  pollMediaTask
};
//# sourceMappingURL=mediaPolling.mjs.map
