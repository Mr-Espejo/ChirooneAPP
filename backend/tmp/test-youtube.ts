import "dotenv/config";
import { composioService } from "../integrations/composioService.js";

async function test() {
  const mediaPath = "C:\\Users\\andre\\Downloads\\DocsDhiroOne\\ChiorooneContent\\tmp\\0223CHiroone.mp4";
  const caption = "Testing YouTube API integration! #ChiroOne #Health #GoldCoast";
  const title = "ChiroOne Helensvale Test Video";

  console.log("--- YouTube API Integration Test ---");
  console.log(`Media Path: ${mediaPath}`);
  
  try {
    const result = await composioService.publishMedia(mediaPath, caption, "youtube", { title });
    console.log("✅ Success!");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Failed!");
    console.error(error);
  }
}

test();
