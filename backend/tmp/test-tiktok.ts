import "dotenv/config";
import { composioService } from "../integrations/composioService.js";

async function test() {
  const mediaPath = "C:\\Users\\andre\\Downloads\\DocsDhiroOne\\ChiorooneContent\\tmp\\0223CHiroone.mp4";
  const caption = "Testing BundleSocial TikTok integration! #ChiroOne #Health #GoldCoast";
  const title = "ChiroOne Helensvale Test";

  console.log("--- TikTok BundleSocial Integration Test ---");
  console.log(`Media Path: ${mediaPath}`);
  
  try {
    const result = await composioService.publishMedia(mediaPath, caption, "tiktok", { title });
    console.log("✅ Success!");
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("❌ Failed!");
    if (error.body && error.body.issues) {
      console.error("Validation Issues:", JSON.stringify(error.body.issues, null, 2));
    } else if (error.request) {
      console.error("Request sent:", JSON.stringify(error.request, null, 2));
      console.error("Status:", error.status);
      console.error("Body:", JSON.stringify(error.body, null, 2));
    } else {
      console.error(error);
    }
  }
}

test();
