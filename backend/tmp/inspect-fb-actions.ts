import "dotenv/config";
import { ComposioToolSet } from "composio-core";

const FACEBOOK_ACCOUNT_ID = "fade4b5b-a701-49b8-8d90-9f060fb4139a";
const FB_PAGE_ID = "343192448887259";

async function getActionSchema(actionName: string) {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  const action: any = await toolset.client.actions.get({ actionName });
  console.log(`\n=== ${actionName} SCHEMA ===`);
  console.log(JSON.stringify(action?.parameters?.properties ?? action, null, 2));
}

async function main() {
  await getActionSchema("FACEBOOK_CREATE_POST");
  await getActionSchema("FACEBOOK_UPLOAD_PHOTO");
}

main().catch(console.error);
