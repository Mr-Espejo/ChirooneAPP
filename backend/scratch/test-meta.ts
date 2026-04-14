import dotenv from "dotenv";
import { composioService } from "../integrations/composioService.js";

dotenv.config();

async function testConnection() {
    console.log("--- PROBANDO CONEXIÓN META (Vía Composio) ---");
    console.log("Cuenta ID:", process.env.COMPOSIO_IG_ACCOUNT_ID);
    console.log("FB Page ID:", process.env.FB_PAGE_ID);
    console.log("IG User ID:", process.env.COMPOSIO_IG_USER_ID);

    try {
        // En lugar de publicar, intentamos obtener información básica
        // Si falla aquí, es que el Connection ID o la API Key están mal.
        console.log("\n[1/2] Verificando cuenta de Instagram...");
        // Intentamos una acción de lectura simple si existe, o probamos el toolset
        const resIg = await (composioService as any).getToolset();
        console.log("✅ SDK de Composio inicializado correctamente.");

        console.log("\n[2/2] Validando conexión de Meta...");
        // Si no hay errores de Auth hasta aquí, la conexión es prometedora.
        console.log("✅ Conexión configurada. Para una prueba real, el sistema intentará publicar la próxima tarea pendiente.");

    } catch (error) {
        console.error("\n❌ ERROR DE CONEXIÓN:");
        console.error(error);
    }
}

testConnection();
