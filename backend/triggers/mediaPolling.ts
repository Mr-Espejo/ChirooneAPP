import { task, wait } from "@trigger.dev/sdk/v3";
import { prisma } from "../utils/prisma.js";
import { generateVideoTask } from "./videoGeneration.js";
import "dotenv/config";

const API_KEY = process.env.KIEAI_API_KEY;

export const pollMediaTask = task({
  id: "poll-media-task",
  maxDuration: 300,
  run: async (payload: { taskId: string; postId: string; companyId: string }) => {
    const { taskId, postId, companyId } = payload;
    let isCompleted = false;
    let attempts = 0;

    console.log(`[Trigger] Starting polling for Task: ${taskId}`);

    // Task delegation to Webhook
    console.log(`[Trigger] Task ${taskId} created. Delegating completion to Webhook.`);

    // Update the externalTaskId to signify it's being processed
    await prisma.contentItem.update({
      where: { id: postId },
      data: {
        externalTaskId: taskId,
        posts: {
          updateMany: {
            where: { status: "WAITING_FOR_MEDIA" },
            data: { status: "GENERATING_MEDIA" } // Assuming there's a GENERATING_MEDIA state or just keep it WAITING
          }
        }
      }
    });

    return { success: true, taskId, message: "Task delegated to Webhook" };
  },
});
