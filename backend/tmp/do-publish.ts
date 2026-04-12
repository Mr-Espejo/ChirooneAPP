import "dotenv/config";
import { PublishingService } from "../modules/publishing/publishing.service.js";

async function runPublish() {
  const service = new PublishingService();
  console.log("Starting publishing process...");
  const results = await service.publishPendingPosts();
  console.log("Results:", JSON.stringify(results, null, 2));
  console.log("Publishing process completed.");
}

runPublish().catch(console.error);
