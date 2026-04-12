import {
  generateVideoTask
} from "./chunk-Y7X6FYQV.mjs";
import {
  prisma,
  task,
  wait
} from "./chunk-G2AHKVNU.mjs";
import {
  __name,
  init_esm
} from "./chunk-5A2LE32G.mjs";

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
      const status = result.data?.status || result.msg;
      if (status === "SUCCESS" || status === "COMPLETED") {
        const imageUrl = result.data?.images?.[0]?.url || result.data?.url;
        if (imageUrl) {
          console.log(`[Trigger] Task ${taskId} COMPLETED! URL: ${imageUrl}`);
          const contentItem = await prisma.contentItem.update({
            where: { id: postId },
            data: {
              mediaUrl: imageUrl,
              posts: {
                updateMany: {
                  where: { status: "WAITING_FOR_MEDIA" },
                  data: { status: "WAITING_FOR_VIDEO" }
                }
              }
            }
          });
          await generateVideoTask.trigger({
            postId,
            imageUrl,
            prompt: contentItem.mediaRequirement,
            // Use mediaRequirement as video prompt if not specified
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
//# sourceMappingURL=chunk-O6AKMM2I.mjs.map
