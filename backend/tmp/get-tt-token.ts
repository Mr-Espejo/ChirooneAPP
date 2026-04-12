import "dotenv/config";
import { ComposioToolSet } from "composio-core";

async function getTikTokToken() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  const accountId = "3cdccb09-981d-4598-841b-e25c7e7fe578";
  
  try {
    const accountInfo = await toolset.client.connectedAccounts.get(accountId);
    console.log(JSON.stringify(accountInfo, null, 2));
  } catch (error) {
    console.error("Error fetching account:", error);
  }
}

getTikTokToken().catch(console.error);
