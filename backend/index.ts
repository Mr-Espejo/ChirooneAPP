import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";

import { BlitzCreativeWeekUseCase } from "./modules/ideation/blitzCreativeWeek.usecase.js";

import { prisma } from "./utils/prisma.js";

import { getAiContextPath } from "./utils/paths.js";

const brandDnaPath = getAiContextPath("brandDna.json");
const brandDna = JSON.parse(fs.readFileSync(brandDnaPath, "utf-8"));

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/creatives", async (req, res) => {
  console.log("[Backend] Request received: GET /api/creatives");
  try {
    const startTime = Date.now();
    const creatives = await prisma.contentItem.findMany({
      include: {
        posts: true,
        plan: {
          select: {
            generatedAt: true,
          },
        },
      },
      orderBy: [
        {
          plan: {
            generatedAt: "desc",
          },
        },
        {
          day: "desc",
        },
      ],
    });
    console.log(`[Backend] Request finished in ${Date.now() - startTime}ms. Items: ${creatives.length}`);
    res.json(creatives);
  } catch (error) {
    console.error("[Backend] Error in /api/creatives:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/generate", async (req, res) => {
  try {
    const useCase = new BlitzCreativeWeekUseCase();
    const data = await useCase.execute("my-company-id", brandDna);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});


app.post("/webhook/kieai", async (req, res) => {
  const payload = req.body;
  const signature = req.headers["x-kieai-signature"] || req.headers["authorization"];

  console.log(`[Webhook] Received from Kie.ai:`, payload.taskId, payload.status);

  if (payload.status === "SUCCESS" || payload.status === "COMPLETED") {
    // Determine if it's an image or video based on the payload structure
    const imageUrl = payload.data?.images?.[0]?.url || (payload.data?.url && !payload.data?.url.match(/\.(mp4|mov)$/i)) ? payload.data?.url : null;
    const videoUrl = payload.data?.videos?.[0]?.url || (payload.data?.url && payload.data?.url.match(/\.(mp4|mov)$/i)) ? payload.data?.url : null;

    try {
      if (imageUrl) {
        // It's an Image task
        const item = await prisma.contentItem.findFirst({ where: { imageTaskId: payload.taskId } });
        if (item) {
          await prisma.contentItem.update({
            where: { id: item.id },
            data: { mediaUrl: imageUrl, imageTaskId: null, posts: { updateMany: { where: {}, data: { status: "WAITING_FOR_VIDEO" } } } }
          });
          console.log(`[Webhook] Image updated for item ${item.id}`);

          // EVENT-DRIVEN: Trigger video generation immediately!
          try {
            const { kieaiService } = await import("./modules/generation/kieaiService.js").catch(() => import("./integrations/kieaiService.js"));
            let videoPrompt = item.videoRequirement || item.hook || "Cinematic transition";
            if (videoPrompt.startsWith("[") || videoPrompt.startsWith("{")) {
              try {
                const parsed = JSON.parse(videoPrompt);
                videoPrompt = Array.isArray(parsed) ? parsed.map((p: any) => p.description || JSON.stringify(p)).join(". ") : (parsed.storyboard || videoPrompt);
              } catch (e) {}
            }
            
            const videoTask = await kieaiService.createVideoFromImage(imageUrl, videoPrompt);
            if (videoTask?.taskId) {
               await prisma.contentItem.update({
                 where: { id: item.id },
                 data: { videoTaskId: videoTask.taskId, posts: { updateMany: { where: {}, data: { status: "GENERATING_VIDEO" } } } }
               });
               console.log(`[Webhook] Fast-tracked video generation for ${item.id}, Task ID: ${videoTask.taskId}`);
            }
          } catch(err) {
            console.error(`[Webhook] Failed to fast-track video:`, err);
          }
        }
      } else if (videoUrl) {
        // It's a Video task
        const item = await prisma.contentItem.findFirst({ where: { videoTaskId: payload.taskId } });
        if (item) {
          await prisma.contentItem.update({
            where: { id: item.id },
            data: { videoUrl: videoUrl, videoTaskId: null, posts: { updateMany: { where: {}, data: { status: "READY_TO_PUBLISH" } } } }
          });
          console.log(`[Webhook] Video updated for item ${item.id}`);
        }
      }
    } catch (e) {
      console.error("[Webhook] Database error:", e);
    }
  } else if (payload.status === "FAILED") {
      console.error(`[Webhook] Task ${payload.taskId} failed:`, payload.msg);
  }
  
  res.json({ received: true });
});

app.post("/api/trigger", express.raw({ type: "application/json" }), (req, res) => {
  res.status(200).send("OK");
});

import { publishingService } from "./modules/publishing/publishing.service.js";
import { syncMediaTaskLogic, startVideoGenerationTaskLogic } from "./triggers/pipelineCrons.js";

app.get("/publish", async (req, res) => {
  try {
    const itemId = req.query.itemId as string | undefined;
    console.log(`[Backend] Manual Pipeline Triggered... ${itemId ? `(Item ID: ${itemId})` : '(All)'}`);
    
    console.log("[Backend] 1. Syncing Media...");
    await syncMediaTaskLogic(itemId);
    
    console.log("[Backend] 2. Starting Video Generation...");
    await startVideoGenerationTaskLogic(itemId);
    
    console.log("[Backend] 3. Publishing Pending Posts...");
    const results = await publishingService.publishPendingPosts({ itemId });
    
    console.log("[Backend] Manual Pipeline Finished!");
    res.json({ success: true, message: "Full pipeline executed", results });
  } catch (error) {
    console.error("[Backend] Error executing manual pipeline:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
    console.log(`[Backend] Express server running at: http://localhost:${port}`);
});
