import "dotenv/config";
import { ComposioToolSet } from "composio-core";

const FACEBOOK_ACCOUNT_ID = "20db8838-ca93-41d6-8d85-210d07cc4add";
const FB_PAGE_ID = "343192448887259";

async function testVideoPost() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  const videoUrl = "https://tempfile.aiquickdraw.com/g/users/760594ce-4ca9-4fd4-b787-523966a5b814/generated/818862f5-ffeb-4cb2-a463-4db81093bd38/generated_video.mp4";
  const description = `Have you caught yourself saying, "I guess this is just my life now"? At ChiroOne Gold Coast, we believe you shouldn't need to organize your life around pain. Whether it's a persistent ache in your lower back or tension headaches, our holistic approach is designed to help you find sustainable relief. 🌿✨ Link in bio to book your initial functional health evaluation.`;
  const title = "El mito de vivir con dolor (Pilar: Creencias)";

  console.log("[FB Video] Posting to page:", FB_PAGE_ID);
  console.log("[FB Video] Video URL:", videoUrl);

  const response = await toolset.executeAction({
    actionName: "FACEBOOK_CREATE_VIDEO_POST",
    params: {
      file_url: videoUrl,
      description,
      title,
      page_id: FB_PAGE_ID,
      published: true,
    },
    connectedAccountId: FACEBOOK_ACCOUNT_ID,
  });

  if (response.successful) {
    console.log("✅ Video posted successfully!");
    console.log(JSON.stringify(response.data, null, 2));
  } else {
    console.error("❌ Failed:");
    console.log(JSON.stringify(response, null, 2));
  }
}

testVideoPost().catch(console.error);
