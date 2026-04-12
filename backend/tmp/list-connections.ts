import "dotenv/config";
import { ComposioToolSet } from "composio-core";

async function list() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });
  
  const connections: any = await toolset.client.connectedAccounts.list({ pageSize: 100 });
  const filtered = connections.items.map((i: any) => ({
    id: i.id,
    appName: i.appName,
    status: i.status,
    entity: i.clientUniqueUserId
  }));
  
  const social = filtered.filter((i: any) => 
    i.appName.includes("instagram") || 
    i.appName.includes("facebook")
  );
  
  console.log(JSON.stringify(social, null, 2));
}

list().catch(console.error);
