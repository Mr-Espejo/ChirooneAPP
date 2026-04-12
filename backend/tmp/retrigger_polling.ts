import { pollMediaTask } from "../triggers/mediaPolling.js";
import fs from "node:fs";
import "dotenv/config";

const DB_PATH = "c:/Users/andre/Downloads/DocsDhiroOne/ChiorooneContent/tmp/db.json";

async function retrigger() {
  if (!fs.existsSync(DB_PATH)) return;
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  
  const pending = db.filter((p: any) => p.status === "WAITING_FOR_IMAGE" && p.taskId && p.taskId !== "mock-task-id");
  
  console.log(`Retriggering polling for ${pending.length} posts...`);

  for (const post of pending) {
    console.log(`Retriggering poll for postId: ${post.id}, taskId: ${post.taskId}`);
    await pollMediaTask.trigger({
        taskId: post.taskId,
        postId: post.id,
        companyId: post.companyId || "my-company-id"
    });
  }
}

retrigger();
