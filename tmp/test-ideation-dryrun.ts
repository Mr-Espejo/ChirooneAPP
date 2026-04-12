import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BlitzCreativeWeekUseCase } from "../modules/ideation/blitzCreativeWeek.usecase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTest() {
  console.log("=== Testing Ideation Use Case (Dry Run) ===");
  try {
    const brandDnaPath = path.join(__dirname, "../../ai-context/brandDna.json");
    const brandDna = JSON.parse(fs.readFileSync(brandDnaPath, "utf-8"));

    const useCase = new BlitzCreativeWeekUseCase();
    
    console.log("Executing use case in dry run mode...");
    const result = await useCase.execute("test-company-id", brandDna, { dryRun: true });
    
    console.log("\nSuccess! Dry Run Result:");
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTest();
