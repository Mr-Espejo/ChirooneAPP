import "dotenv/config";
import { ComposioToolSet } from "composio-core";

const IG_ACCOUNT_ID = "0b6c39bd-3100-4b5c-9aa0-d2976fb532b5";

async function checkStatus() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  const schema: any = await toolset.client.actions.get({ actionName: "INSTAGRAM_GET_POST_STATUS" });
  console.log("SCHEMA:", JSON.stringify(schema?.parameters?.properties ?? {}, null, 2));

  const statusRes: any = await toolset.executeAction({
    actionName: "INSTAGRAM_GET_POST_STATUS",
    params: { creation_id: "17931950403227305" },
    connectedAccountId: IG_ACCOUNT_ID,
  });

  console.log("\nFull response:");
  console.log(JSON.stringify(statusRes, null, 2));
}

checkStatus().catch(console.error);
