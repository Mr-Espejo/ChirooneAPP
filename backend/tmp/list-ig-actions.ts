import "dotenv/config";
import { ComposioToolSet } from "composio-core";

async function listIgActions() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  const actions: any = await toolset.client.actions.list({ apps: "instagram", page_size: 100 });
  const names = (actions?.items ?? actions).map((a: any) => a.name);
  console.log(JSON.stringify(names, null, 2));
}

listIgActions().catch(console.error);
