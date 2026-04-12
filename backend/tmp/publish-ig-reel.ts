import "dotenv/config";
import { ComposioToolSet } from "composio-core";

const IG_ACCOUNT_ID = "0b6c39bd-3100-4b5c-9aa0-d2976fb532b5";
const IG_USER_ID = "17841466819125136";
const CREATION_ID = "17931950403227305";

async function publish() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  console.log("[IG] Publishing container:", CREATION_ID);

  const publishRes: any = await toolset.executeAction({
    actionName: "INSTAGRAM_CREATE_POST",
    params: {
      ig_user_id: IG_USER_ID,
      creation_id: CREATION_ID,
    },
    connectedAccountId: IG_ACCOUNT_ID,
  });

  if (publishRes.successful) {
    console.log("✅ Reel published successfully!");
    console.log(JSON.stringify(publishRes.data, null, 2));
  } else {
    console.error("❌ Publish failed:");
    console.log(JSON.stringify(publishRes, null, 2));
  }
}

publish().catch(console.error);
