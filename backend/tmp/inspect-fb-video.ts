import "dotenv/config";
import { ComposioToolSet } from "composio-core";

const FACEBOOK_ACCOUNT_ID = "20db8838-ca93-41d6-8d85-210d07cc4add";
const FB_PAGE_ID = "343192448887259";

async function testVideoPost() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  const schema: any = await toolset.client.actions.get({ actionName: "FACEBOOK_CREATE_VIDEO_POST" });
  console.log("=== FACEBOOK_CREATE_VIDEO_POST SCHEMA ===");
  console.log(JSON.stringify(schema?.parameters?.properties ?? schema, null, 2));
}

testVideoPost().catch(console.error);
