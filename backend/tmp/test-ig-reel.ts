import "dotenv/config";
import { ComposioToolSet } from "composio-core";

const IG_ACCOUNT_ID = "0b6c39bd-3100-4b5c-9aa0-d2976fb532b5";
const IG_USER_ID = "17841466819125136";

const VIDEO_URL = "https://tempfile.aiquickdraw.com/g/users/760594ce-4ca9-4fd4-b787-523966a5b814/generated/818862f5-ffeb-4cb2-a463-4db81093bd38/generated_video.mp4";
const COVER_URL = "https://tempfile.aiquickdraw.com/image-format-converter/1775923585957-8anqjpjqlyb.jpg";
const CAPTION = `Have you caught yourself saying, "I guess this is just my life now"? At ChiroOne Gold Coast, we believe you shouldn't have to organize your life around pain. Whether it's a persistent ache in your lower back or tension headaches, our holistic approach is designed to help you find sustainable relief. 🌿✨ Link in bio to book your initial functional health evaluation.`;

async function waitUntilReady(toolset: ComposioToolSet, containerId: string, maxWaitMs = 120_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 8000));
    
    const statusRes: any = await toolset.executeAction({
      actionName: "INSTAGRAM_GET_POST_STATUS",
      params: { ig_media_id: containerId },
      connectedAccountId: IG_ACCOUNT_ID,
    });

    const status = statusRes?.data?.status_code ?? statusRes?.data?.status ?? "UNKNOWN";
    console.log(`[IG] Status: ${status} (${Math.round((Date.now() - start) / 1000)}s elapsed)`);

    if (status === "FINISHED") return true;
    if (status === "ERROR" || status === "EXPIRED") {
      console.error("[IG] Container failed:", statusRes?.data?.error_code);
      return false;
    }
  }
  console.error("[IG] Timeout waiting for media to be ready.");
  return false;
}

async function testIgReelPost() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  console.log("[IG] Step 1: Creating media container...");
  const containerRes: any = await toolset.executeAction({
    actionName: "INSTAGRAM_CREATE_MEDIA_CONTAINER",
    params: {
      ig_user_id: IG_USER_ID,
      video_url: VIDEO_URL,
      cover_url: COVER_URL,
      caption: CAPTION,
      media_type: "REELS",
      content_type: "reel",
    },
    connectedAccountId: IG_ACCOUNT_ID,
  });

  if (!containerRes.successful) {
    console.error("[IG] ❌ Failed to create container:", JSON.stringify(containerRes));
    return;
  }

  const creationId = containerRes?.data?.id;
  console.log(`[IG] Container created: ${creationId}`);

  console.log("\n[IG] Step 2: Polling until media is ready...");
  const ready = await waitUntilReady(toolset, creationId);

  if (!ready) {
    console.error("[IG] ❌ Media never became ready.");
    return;
  }

  console.log("\n[IG] Step 3: Publishing...");
  const publishRes: any = await toolset.executeAction({
    actionName: "INSTAGRAM_CREATE_POST",
    params: {
      ig_user_id: IG_USER_ID,
      creation_id: creationId,
    },
    connectedAccountId: IG_ACCOUNT_ID,
  });

  if (publishRes.successful) {
    console.log("\n✅ Reel published successfully!");
    console.log(JSON.stringify(publishRes.data, null, 2));
  } else {
    console.error("\n❌ Publish failed:");
    console.log(JSON.stringify(publishRes, null, 2));
  }
}

testIgReelPost().catch(console.error);
