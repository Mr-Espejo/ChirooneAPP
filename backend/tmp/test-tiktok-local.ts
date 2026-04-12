import "dotenv/config";
import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";
import { createWriteStream, readFileSync, statSync } from "fs";
import { pipeline } from "stream/promises";
import FormData from "form-data";
import path from "path";

const app = express();
const PORT = 3455;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback/`;

// Credenciales
const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;

// En memoria para simplificar
let codeVerifier = "";
let state = "";

const VIDEO_URL = "https://tempfile.aiquickdraw.com/g/users/760594ce-4ca9-4fd4-b787-523966a5b814/generated/818862f5-ffeb-4cb2-a463-4db81093bd38/generated_video.mp4";
const VIDEO_PATH = path.join(process.cwd(), "tmp", "chiroone-tt-ready.mp4");

// 1. Iniciar autenticación
app.get("/oauth/start", (req, res) => {
  if (!CLIENT_KEY || !CLIENT_SECRET) {
    return res.send("Falta TIKTOK_CLIENT_KEY o TIKTOK_CLIENT_SECRET en .env");
  }

  // Generar PKCE y state
  state = crypto.randomBytes(16).toString("hex");
  codeVerifier = crypto.randomBytes(32).toString("hex");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("hex");

  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", CLIENT_KEY);
  authUrl.searchParams.set("response_type", "code");
  // Scopes necesarios para subir videos
  authUrl.searchParams.set("scope", "user.info.basic,video.upload");
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  console.log(`[TikTok OAuth] Redirigiendo a TikTok: ${authUrl.href}`);
  res.redirect(authUrl.href);
});

// 2. Callback y subida
app.get("/callback/", async (req, res) => {
  const code = req.query.code as string;
  const returnedState = req.query.state as string;

  if (returnedState !== state) return res.send("State mismatch");
  if (!code) return res.send("No code provided");

  try {
    console.log("[TikTok OAuth] Intercambiando code por access_token...");
    
    const tokenForm = new URLSearchParams({
      client_key: CLIENT_KEY!,
      client_secret: CLIENT_SECRET!,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    });

    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenForm,
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(`Token Error: ${JSON.stringify(tokenData)}`);

    const accessToken = tokenData.access_token;
    console.log(`[TikTok OAuth] Éxito! Token obtenido.`);

    // --- Subida directa del video ---
    console.log(`[TikTok Upload] 1. Descargando video temporal localmente...`);
    const vidRes = await fetch(VIDEO_URL);
    await pipeline(vidRes.body as any, createWriteStream(VIDEO_PATH));

    console.log(`[TikTok Upload] 2. Iniciando subida directa del archivo...`);
    await uploadDirectToTikTok(accessToken, VIDEO_PATH);

    res.send("<h1>¡Exito!</h1><p>Revisa la terminal, el video se está procesando y subiendo.</p>");
  } catch (error: any) {
    console.error(error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Función para subir directamente a TikTok (Content Posting API)
async function uploadDirectToTikTok(accessToken: string, filePath: string) {
  const fileSize = statSync(filePath).size;
  
  // Paso A: Iniciar subida
  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
      post_info: {
        title: "Have you caught yourself saying... \n\n#ChiroOne #GoldCoast",
        privacy_level: "SELF_ONLY", // Déjalo en privado hasta confirmar que subió bien
        disable_comment: false,
        video_cover_timestamp_ms: 1000
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: fileSize,
        chunk_size: fileSize, // Soportan subida de un solo trozo hasta un límite
        total_chunk_count: 1
      }
    })
  });

  const initData = await initRes.json();
  if (initData.error?.code !== "ok") throw new Error(JSON.stringify(initData));

  const publishId = initData.data.publish_id;
  const uploadUrl = initData.data.upload_url;

  console.log(`[TikTok Upload] Init completado (publish_id: ${publishId}). Subiendo archivo a la URL generada...`);

  // Paso B: Subir (Upload the file)
  const videoBuffer = readFileSync(filePath);
  const uploadRequest = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
        "Content-Type": "video/mp4",
        "Content-Length": fileSize.toString(),
        "Content-Range": `bytes 0-${fileSize - 1}/${fileSize}`
    },
    body: videoBuffer
  });

  if (uploadRequest.status >= 200 && uploadRequest.status < 300) {
      console.log(`[TikTok Upload] ✅ Archivo subido con éxito.`);
      console.log(`El video ahora se procesará en TikTok. Revisa tu Inbox o perfil en unos minutos. ID: ${publishId}`);
  } else {
      console.error(`[TikTok Upload] ❌ Falló la subida final HTTP ${uploadRequest.status}`);
  }
}

app.listen(PORT, "127.0.0.1", () => {
    console.log(`\n🚀 TikTok Auth Server listo.`);
    console.log(`Abre en tu navegador para empezar: http://127.0.0.1:${PORT}/oauth/start`);
});
