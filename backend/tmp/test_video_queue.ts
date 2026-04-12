import fs from "node:fs";
import { generateVideoTask } from "../triggers/videoGeneration.js";
import "dotenv/config";

const DB_PATH = "c:/Users/andre/Downloads/DocsDhiroOne/ChiorooneContent/tmp/db.json";

async function testQueue() {
  if (!fs.existsSync(DB_PATH)) {
    console.log("DB not found.");
    return;
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  
  console.log(`Found ${db.length} posts. Triggering sequential video generation...`);

  for (const post of db) {
    if (post.status === "WAITING_FOR_VIDEO") {
      console.log(`Triggering SINGLE test video for: ${post.headline}`);
      await generateVideoTask.trigger({
        postId: post.id,
        imageUrl: post.media_url,
        prompt: post.video_prompt,
        companyId: "my-company-id"
      });
      break; // TEST CON SOLO UNO
    }
  }

  console.log("All video tasks have been queued in Trigger.dev.");
  console.log("Check your Trigger.dev dashboard to see them running one-by-one.");
}

testQueue();
