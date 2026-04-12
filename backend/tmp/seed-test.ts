import "dotenv/config";
import { prisma } from "../utils/prisma.js";

async function seedTestPost() {
  // Clear existing to avoid unique constraint issues or "No pending posts"
  await prisma.post.deleteMany({});
  await prisma.contentItem.deleteMany({});
  
  const plan = await prisma.contentPlan.upsert({
    where: { id: "test-plan-id" },
    update: {},
    create: {
      id: "test-plan-id",
      status: "ACTIVE",
      focus: "Test Focus"
    }
  });

  const contentItem = await prisma.contentItem.create({
    data: {
      id: "48c61ff3-7daa-4585-a79a-b8c80964f4d4",
      day: 1,
      category: "Creencias",
      hook: "El mito de vivir con dolor",
      body: "Have you caught yourself saying, 'I guess this is just my life now'? At ChiroOne Gold Coast, we believe you shouldn't have to organize your life around pain.",
      cta: "Link in bio to book your initial functional health evaluation. 🌿✨",
      format: "video",
      mediaRequirement: "cinematic walk on beach",
      mediaUrl: "https://tempfile.aiquickdraw.com/g/users/760594ce-4ca9-4fd4-b787-523966a5b814/generated/818862f5-ffeb-4cb2-a463-4db81093bd38/generated_video.mp4",
      planId: plan.id
    }
  });

  await prisma.post.create({
    data: {
      platform: "instagram",
      status: "READY_TO_PUBLISH",
      contentItemId: contentItem.id
    }
  });

  await prisma.post.create({
    data: {
      platform: "facebook",
      status: "READY_TO_PUBLISH",
      contentItemId: contentItem.id
    }
  });

  console.log("Test data seeded into Prisma successfully.");
}

seedTestPost().catch(console.error);
