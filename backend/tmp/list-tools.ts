import "dotenv/config";
import { ComposioToolSet } from "composio-core";

async function findTools() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });
  
  const actions: any = await toolset.client.actions.list({ appId: "b44fc01f-80e1-4063-aa28-a66334d14904" });
  console.log(JSON.stringify(actions.items.map(t => t.name), null, 2));
}

findTools().catch(console.error);
