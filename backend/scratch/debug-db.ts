import { prisma } from "../utils/prisma.js";

async function main() {
  try {
    console.log("Checking DB connection...");
    const count = await prisma.contentItem.count();
    console.log(`Total ContentItems: ${count}`);
    const items = await prisma.contentItem.findMany({ 
        take: 1, 
        include: { posts: true } 
    });
    console.log("Sample Data:", JSON.stringify(items, null, 2));
  } catch (error) {
    console.error("DB Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
