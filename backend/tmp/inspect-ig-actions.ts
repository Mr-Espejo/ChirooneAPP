import "dotenv/config";
import { ComposioToolSet } from "composio-core";

const IG_ACCOUNT_ID = "0b6c39bd-3100-4b5c-9aa0-d2976fb532b5";

async function inspectSchemas() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  for (const action of ["INSTAGRAM_CREATE_MEDIA_CONTAINER", "INSTAGRAM_CREATE_POST"]) {
    const schema: any = await toolset.client.actions.get({ actionName: action });
    console.log(`\n=== ${action} ===`);
    console.log(JSON.stringify(schema?.parameters?.properties ?? {}, null, 2));
  }
}

inspectSchemas().catch(console.error);
