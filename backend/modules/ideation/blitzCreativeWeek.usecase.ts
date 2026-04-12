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

    // Helper to find closest Monday (1) or Tuesday (2)
    const getBaseDate = () => {
      const now = new Date();
      const currentDay = now.getDay();
      const targets = [1, 2];
      let minDiff = Infinity;

      for (const target of targets) {
        for (const offset of [-7, 0, 7]) {
          const totalOffset = (target - currentDay) + offset;
          if (Math.abs(totalOffset) < Math.abs(minDiff)) {
            minDiff = totalOffset;
          }
        }
      }

      const res = new Date(now);
      res.setDate(now.getDate() + minDiff);
      res.setHours(9, 0, 0, 0);
      return res;
    };

    const startDate = getBaseDate();

    const contentPlan = await prisma.contentPlan.create({
      data: {
        status: "GENERATING_MEDIA",
        focus: rawData.strategyFocus || "Weekly Strategy",
        schedule: {
          create: planItems.map((item: any) => {
            const dayMap: Record<string, number> = {
              "monday": 1, "tuesday": 2, "wednesday": 3, "thursday": 4,
              "friday": 5, "saturday": 6, "sunday": 7
            };

            let dayNum = 1;
            if (typeof item.day === 'number') {
              dayNum = item.day;
            } else if (typeof item.day === 'string') {
              dayNum = dayMap[item.day.toLowerCase()] || 1;
            }

            const publishDate = new Date(startDate);
            publishDate.setDate(startDate.getDate() + (dayNum - 1));

            return {
              day: dayNum,
              category: item.pillar || item.category || "General",
              hook: item.hook || item.topic,
              body: item.caption,
              cta: item.cta || "Check link in bio",
              format: "VIDEO_SHORT",
              mediaRequirement: item.image_prompt,
              videoRequirement: JSON.stringify(item.storyboard),
              posts: {
                create: [
                  {
                    platform: "INSTAGRAM",
                    status: "WAITING_FOR_MEDIA",
                    publishedAt: publishDate
                  },
                  {
                    platform: "TIKTOK",
                    status: "WAITING_FOR_MEDIA",
                    publishedAt: publishDate
                  },
                  {
                    platform: "FACEBOOK",
                    status: "WAITING_FOR_MEDIA",
                    publishedAt: publishDate
                  },
                  {
                    platform: "YOUTUBE",
                    status: "WAITING_FOR_MEDIA",
                    publishedAt: publishDate
                  }
                ]
              }
            };
          })
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
        await prisma.contentItem.update({
          where: { id: item.id },
          data: { imageTaskId: taskId }
        });
        console.log(`[UseCase] Image task saved to DB: ${taskId}`);
      }

      results.push({ contentItemId: item.id, taskId });
    }

    return { planId: contentPlan.id, results };
  }
}
