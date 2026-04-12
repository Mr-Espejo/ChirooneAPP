import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

// Consistent path for db.json in backend/tmp
const DB_PATH = "c:/Users/andre/Downloads/DocsDhiroOne/ChiorooneContent/tmp/db.json";
const API_KEY = process.env.KIEAI_API_KEY;

async function checkTaskStatus(taskId) {
  const url = `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { "x-api-key": API_KEY }
  });
  return await resp.json();
}

async function run() {
  if (!fs.existsSync(DB_PATH)) {
    console.log("DB not found at", DB_PATH);
    return;
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  let updated = false;

  for (const post of db) {
    if (post.taskId && post.status === "WAITING_FOR_IMAGE") {
      console.log(`Checking status for Day: ${post.headline} (Task: ${post.taskId})...`);
      try {
        const result = await checkTaskStatus(post.taskId);
        console.log(`Full Result for ${post.id}:`, JSON.stringify(result, null, 2));
        const status = result.data?.status || result.msg;
        console.log(`Result: ${status}`);
        
        if (status === "SUCCESS" || status === "COMPLETED") {
          const imageUrl = result.data?.images?.[0]?.url || result.data?.url;
          if (imageUrl) {
            post.media_url = imageUrl;
            post.status = "WAITING_FOR_VIDEO";
            updated = true;
            console.log(`[FOUND IMAGE] for ${post.id}: ${imageUrl}`);
          }
        }
      } catch (e) {
        console.error(`Error checking ${post.id}:`, e.message);
      }
    }
  }

  if (updated) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log("DB updated with found images.");
  } else {
    console.log("No images ready yet or no updates found.");
  }
}

run();
