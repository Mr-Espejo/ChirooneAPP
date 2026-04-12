import "dotenv/config";
import { ComposioToolSet } from "composio-core";

const TIKTOK_ACCOUNT_ID = "3cdccb09-981d-4598-841b-e25c7e7fe578";
const VIDEO_URL = "https://tempfile.aiquickdraw.com/g/users/760594ce-4ca9-4fd4-b787-523966a5b814/generated/818862f5-ffeb-4cb2-a463-4db81093bd38/generated_video.mp4";
const CAPTION = `Have you caught yourself saying, "I guess this is just my life now"? At ChiroOne Gold Coast, we believe you shouldn't have to organize your life around pain. 🌿✨ Link in bio to book your initial functional health evaluation. #ChiroOne #GoldCoast`;

async function testPublishUrl() {
  const toolset = new ComposioToolSet({ apiKey: process.env.COMPOSIO_API_KEY || "" });

  console.log("[TikTok] Attempting TIKTOK_PUBLISH_VIDEO with public URL...");
  const publishRes: any = await toolset.executeAction({
    actionName: "TIKTOK_PUBLISH_VIDEO",
    params: {
      video_url: VIDEO_URL,
      caption: CAPTION,
      privacy_level: "SELF_ONLY",
    },
    connectedAccountId: TIKTOK_ACCOUNT_ID,
  });

  console.log("Publish response:", JSON.stringify(publishRes, null, 2));

  if (publishRes.successful) {
    const publishId = publishRes.data?.publish_id || publishRes.data?.data?.publish_id;
    console.log(`\n✅ Init started successfully! Publish ID: ${publishId}`);
    
    // Polling TikTok status
    console.log("\nPolling status...");
    for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 10000));
        const statusRes: any = await toolset.executeAction({
            actionName: "TIKTOK_FETCH_PUBLISH_STATUS",
            params: { publish_id: publishId },
            connectedAccountId: TIKTOK_ACCOUNT_ID,
        });
        console.log(`Status attempt ${i+1}:`, statusRes?.data?.status || "UNKNOWN");
        if (statusRes?.data?.status === "PUBLISH_COMPLETE") break;
    }
  }
}

testPublishUrl().catch(console.error);
