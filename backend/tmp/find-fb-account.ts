import "dotenv/config";
import { ComposioToolSet } from "composio-core";

async function findFbAccount() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  const accounts: any = await toolset.client.connectedAccounts.list({ appName: "facebook" });
  const items = accounts?.items ?? accounts;
  console.log("Facebook connected accounts:");
  console.log(JSON.stringify(items.map((a: any) => ({
    id: a.id,
    status: a.status,
    entityId: a.entityId,
    createdAt: a.createdAt,
  })), null, 2));
}

findFbAccount().catch(console.error);
