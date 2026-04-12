import "dotenv/config";
import { ComposioToolSet } from "composio-core";

async function listFbActions() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  const actions: any = await toolset.client.actions.list({ apps: "facebook", page_size: 100 });
  const names = (actions?.items ?? actions)
    .map((a: any) => a.name)
    .filter((n: string) => n);

  console.log("All Facebook actions:");
  console.log(JSON.stringify(names, null, 2));
}

listFbActions().catch(console.error);
