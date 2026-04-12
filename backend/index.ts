import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";

import { BlitzCreativeWeekUseCase } from "./modules/ideation/blitzCreativeWeek.usecase.js";

import { prisma } from "./utils/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const brandDna = JSON.parse(fs.readFileSync(path.join(__dirname, "../ai-context/brandDna.json"), "utf-8"));

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
      },
      orderBy: {
        day: "asc",
      },
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


app.post("/webhook/media/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  
  console.log(`[Webhook] Media result for ${id}:`, payload.status);

  if (payload.status === "SUCCESS" || payload.status === "COMPLETED") {
    const imageUrl = payload.data?.images?.[0]?.url || payload.data?.url;
    if (imageUrl) {
      await prisma.contentItem.update({
        where: { id },
        data: { mediaUrl: imageUrl }
      });

      await prisma.post.updateMany({
        where: { contentItemId: id },
        data: { status: "READY_TO_PUBLISH" }
      });
      
      console.log(`[Webhook] ContentItem ${id} and related posts updated with media URL.`);
    }
  }
  
  res.json({ received: true });
});

app.post("/api/trigger", express.raw({ type: "application/json" }), (req, res) => {
  res.status(200).send("OK");
});

import { publishingService } from "./modules/publishing/publishing.service.js";

app.get("/publish", async (req, res) => {
  try {
    const results = await publishingService.publishPendingPosts();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
    console.log(`[Backend] Express server running at: http://localhost:${port}`);
});
