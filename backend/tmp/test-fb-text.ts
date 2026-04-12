import "dotenv/config";
import { ComposioToolSet } from "composio-core";

const FACEBOOK_ACCOUNT_ID = "20db8838-ca93-41d6-8d85-210d07cc4add";
const FB_PAGE_ID = "343192448887259";

async function testTextPost() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  console.log("[FB Test] Trying text post via FACEBOOK_CREATE_POST...");

  const response = await toolset.executeAction({
    actionName: "FACEBOOK_CREATE_POST",
    params: {
      message: "🌿 Test post desde ChiroOne pipeline automatizado. ¡Esto es una prueba! #ChiroOne #GoldCoast",
      page_id: FB_PAGE_ID,
      published: true,
    },
    connectedAccountId: FACEBOOK_ACCOUNT_ID,
  });

  if (response.successful) {
    console.log("✅ Text post published!");
    console.log(JSON.stringify(response.data, null, 2));
  } else {
    console.error("❌ Failed:");
    console.log(JSON.stringify(response, null, 2));
  }
}

testTextPost().catch(console.error);
