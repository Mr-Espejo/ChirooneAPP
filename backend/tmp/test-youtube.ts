import "dotenv/config";
import fetch from "node-fetch";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import { Composio } from "composio-core";

const YOUTUBE_CONNECTED_ACCOUNT_ID = "155880df-8516-4e0d-8c79-d9e6c68e30fc"; 
const VIDEO_URL = "https://tempfile.aiquickdraw.com/g/users/760594ce-4ca9-4fd4-b787-523966a5b814/generated/818862f5-ffeb-4cb2-a463-4db81093bd38/generated_video.mp4";
const VIDEO_PATH = path.join(process.cwd(), "tmp", "chiroone-yt.mp4");

const TITLE = "Have you caught yourself saying this? 🌿✨ #Shorts #ChiroOne";
const DESCRIPTION = `At ChiroOne Gold Coast, we believe you shouldn't have to organize your life around pain. 🌿✨ Link in bio to book your initial functional health evaluation.\n\n#ChiroOne #GoldCoast #Chiropractic #Health #Wellness`;

async function uploadToYoutube() {
  try {
    // IMPORTANTE: USAR Composio y autoUploadDownloadFiles
    const composio = new Composio({ 
        apiKey: process.env.COMPOSIO_API_KEY || "",
        // @ts-ignore
        autoUploadDownloadFiles: true // Activamos el file interceptor (en caso haya en la versin que tengan)
    });

    console.log("1. Descargando video temporal localmente...");
    const vidRes = await fetch(VIDEO_URL);
    await pipeline(vidRes.body as any, createWriteStream(VIDEO_PATH));
    console.log(`✅ Video descargado en: ${VIDEO_PATH}\n`);

    console.log("2. Enviando acción a Composio...");
    const response: any = await composio.actions.execute("YOUTUBE_UPLOAD_VIDEO", {
        title: TITLE,
        description: DESCRIPTION,
        videoFilePath: VIDEO_PATH, 
        categoryId: "22",
        tags: ["chiropractor", "goldcoast", "health"],
        privacyStatus: "private"
    }, YOUTUBE_CONNECTED_ACCOUNT_ID);

    console.log("\n✅ Respuesta de Composio:");
    console.log(JSON.stringify(response, null, 2));

  } catch (error: any) {
    if (error.response && error.response.data) {
        console.error("Error crítico (API):", JSON.stringify(error.response.data, null, 2));
    } else {
        console.error("Error crítico:", error.message || error);
    }
  }
}

uploadToYoutube();
