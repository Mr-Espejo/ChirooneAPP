import "dotenv/config";
import { ComposioToolSet } from "composio-core";

const FACEBOOK_ACCOUNT_ID = "20db8838-ca93-41d6-8d85-210d07cc4add";
const FB_PAGE_ID = "343192448887259";

async function testFacebookPost() {
  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY || "",
  });

  const imageUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800";
  const caption = "🌿 ¿Sabías que el dolor crónico muchas veces es una señal que tu cuerpo necesita ayuda? En ChiroOne Gold Coast tomamos un enfoque holístico para que te sientas en tu mejor versión. ¡Reserva tu evaluación hoy! #ChiroOne #GoldCoast #ChiropracticCare";

  console.log("[FB Test] Using new account:", FACEBOOK_ACCOUNT_ID);
  console.log("[FB Test] Page ID:", FB_PAGE_ID);

  const response = await toolset.executeAction({
    actionName: "FACEBOOK_UPLOAD_PHOTO",
    params: {
      url: imageUrl,
      caption,
      page_id: FB_PAGE_ID,
      published: true,
    },
    connectedAccountId: FACEBOOK_ACCOUNT_ID,
  });

  if (response.successful) {
    console.log("✅ Photo posted successfully!");
    console.log(JSON.stringify(response.data, null, 2));
  } else {
    console.error("❌ Failed:");
    console.log(JSON.stringify(response, null, 2));
  }
}

testFacebookPost().catch(console.error);
