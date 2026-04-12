import "dotenv/config";
import { ComposioToolSet } from "composio-core";

async function checkYoutubeConnection() {
  if (!process.env.COMPOSIO_API_KEY) {
    console.error("No COMPOSIO_API_KEY found in .env");
    return;
  }

  const toolset = new ComposioToolSet({ apiKey: process.env.COMPOSIO_API_KEY });
  
  try {
    const integrations = await toolset.client.connectedAccounts.get();
    
    // Filtramos las cuentas relacionadas a YouTube o Google
    const youtubeAccounts = integrations.items.filter(acc => 
      acc.appUniqueId.toLowerCase().includes('youtube') || 
      acc.appUniqueId.toLowerCase().includes('google')
    );

    if (youtubeAccounts.length === 0) {
      console.log("❌ No hay cuentas de YouTube/Google conectadas en Composio.");
    } else {
      console.log(`✅ ¡Cuentas de YouTube / Google encontradas! (${youtubeAccounts.length})`);
      youtubeAccounts.forEach(acc => {
        console.log(`\n- ID de Conexión: ${acc.id}`);
        console.log(`- App: ${acc.appUniqueId}`);
        console.log(`- Estado: ${acc.status}`);
        console.log(`- Creada: ${acc.createdAt}`);
      });
    }

  } catch (error) {
    console.error("Error consultando cuentas:", error);
  }
}

checkYoutubeConnection();
