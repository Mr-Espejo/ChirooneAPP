import "dotenv/config";
import { ComposioToolSet } from "composio-core";

async function listApps() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });
  
  const apps: any = await toolset.client.apps.list({ page_size: 1000 });
  const matches = apps.filter((a: any) => a.name.toLowerCase().includes("instagram") || a.name.toLowerCase().includes("facebook"));
  console.log(JSON.stringify(matches, null, 2));
}

listApps().catch(console.error);
