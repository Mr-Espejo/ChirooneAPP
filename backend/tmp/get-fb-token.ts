import "dotenv/config";
import { ComposioToolSet } from "composio-core";

const FACEBOOK_ACCOUNT_ID = "20db8838-ca93-41d6-8d85-210d07cc4add";

async function getPageToken() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  const response: any = await toolset.executeAction({
    actionName: "FACEBOOK_GET_USER_PAGES",
    params: {},
    connectedAccountId: FACEBOOK_ACCOUNT_ID,
  });

  const pages = response?.data?.response_data?.data ?? [];
  for (const page of pages) {
    console.log(`\nPage: ${page.name}`);
    console.log(`ID: ${page.id}`);
    console.log(`Access Token: ${page.access_token}`);
  }
}

getPageToken().catch(console.error);
