import "dotenv/config";
import { ComposioToolSet } from "composio-core";

const FACEBOOK_ACCOUNT_ID = "fade4b5b-a701-49b8-8d90-9f060fb4139a";

async function getFbPageId() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  console.log("[FB] Getting available pages...");
  try {
    const response = await toolset.executeAction({
      actionName: "FACEBOOK_GET_USER_PAGES",
      params: {},
      connectedAccountId: FACEBOOK_ACCOUNT_ID,
    });
    console.log("[FB] Pages response:");
    console.log(JSON.stringify(response, null, 2));
  } catch (e: any) {
    console.error("Error:", e?.message);
  }
}

getFbPageId();
