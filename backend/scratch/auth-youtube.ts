import { google } from "googleapis";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
// Asegúrate de que esta URL esté permitida en tu Google Cloud Console (OAuth 2.0 Client IDs)
const REDIRECT_URI = "https://developers.google.com/oauthplayground"; 

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("❌ ERROR: Faltan YOUTUBE_CLIENT_ID o YOUTUBE_CLIENT_SECRET en el .env");
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", 
});

console.log("\n--- CONFIGURACIÓN DE YOUTUBE ---");
console.log("1. Abre este enlace en tu navegador:\n");
console.log(authUrl);
console.log("\n2. Inicia sesión con la NUEVA cuenta de YouTube.");
console.log("3. Haz clic en 'Autorizar' u 'Opciones avanzadas -> Ir a (nombre de tu app)'.");
console.log("4. Serás redirigido a OAuth Playground. En la URL del navegador, busca el parámetro '?code=...'");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question("\n5. Pega el código que copiaste aquí: ", async (code) => {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log("\n✅ ¡LOGRADO!");
        console.log("\nPon este valor en tu .env (YOUTUBE_REFRESH_TOKEN):");
        console.log("-------------------------------------------");
        console.log(tokens.refresh_token);
        console.log("-------------------------------------------");
        console.log("\nDespués de actualizar el .env, no olvides reiniciar el backend.");
    } catch (error) {
        console.error("❌ Error al obtener el token:", error);
    } finally {
        rl.close();
    }
});
