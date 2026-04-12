import { prisma } from "../../utils/prisma.js";
import { llmService } from "../../utils/llm.js";
import { mediaService } from "../generation/media.service.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pollMediaTask } from "../../triggers/mediaPolling.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class BlitzCreativeWeekUseCase {
  async execute(companyId: string, brandDna: any, options?: { dryRun?: boolean }) {
    const blitzPromptPath = path.join(__dirname, "../../../ai-context/blitzPrompt.md");
    if (!fs.existsSync(blitzPromptPath)) {
      throw new Error(`Blitz prompt file not found at ${blitzPromptPath}`);
    }
    
    const basePrompt = fs.readFileSync(blitzPromptPath, "utf-8");
    const promptTemplate = basePrompt.replace("{{brandDna}}", JSON.stringify(brandDna));

    console.log("[UseCase] Generating content strategy for company:", companyId, options?.dryRun ? "(DRY RUN)" : "");
    
    if (options?.dryRun) {
      console.log("[UseCase] Dry run mode active: Skipping LLM and real task creation.");
      return {
        planId: "mock-plan-id",
        results: [
          { contentItemId: "mock-item-1", taskId: "mock-task-1" },
          { contentItemId: "mock-item-2", taskId: "mock-task-2" }
        ],
        mockData: { status: "Success, APIs bypassed" }
      };
    }

    const rawData = await llmService.structured(promptTemplate, null);
    const planItems = rawData.plan || [];
    
    const contentPlan = await prisma.contentPlan.create({
      data: {
        status: "GENERATING_MEDIA",
        focus: rawData.strategyFocus || "Weekly Strategy",
        schedule: {
          create: planItems.map((item: any) => ({
            day: item.day,
            category: item.category || "General",
            hook: item.hook || item.topic,
            body: item.body || item.caption,
            cta: item.cta || "Check link in bio",
            format: "VIDEO_SHORT",
            mediaRequirement: item.image_prompt,
            posts: {
              create: [
                { platform: "INSTAGRAM", status: "WAITING_FOR_MEDIA" },
                { platform: "TIKTOK", status: "WAITING_FOR_MEDIA" }
              ]
            }
          }))
        }
      },
      include: {
        schedule: {
          include: {
            posts: true
          }
        }
      }
    });

    const results = [];

    for (const item of contentPlan.schedule) {
      const taskId = await mediaService.createMediaTask(
        item.mediaRequirement,
        "9:16",
        companyId,
        item.id
      );

      if (taskId !== "mock-task-id") {
        await pollMediaTask.trigger({ taskId, postId: item.id, companyId });
        console.log(`[UseCase] Triggered polling for ${taskId}`);
      }
      
      results.push({ contentItemId: item.id, taskId });
    }

    return { planId: contentPlan.id, results };
  }
}
