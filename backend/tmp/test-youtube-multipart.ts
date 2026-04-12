import "dotenv/config";
import fetch from "node-fetch";
import path from "path";
import crypto from "crypto";
import axios from "axios";
// @ts-ignore
import { Composio } from "composio-core";

const YOUTUBE_CONNECTED_ACCOUNT_ID = "155880df-8516-4e0d-8c79-d9e6c68e30fc"; 
const VIDEO_URL = "https://tempfile.aiquickdraw.com/g/users/760594ce-4ca9-4fd4-b787-523966a5b814/generated/818862f5-ffeb-4cb2-a463-4db81093bd38/generated_video.mp4";

const TITLE = "Have you caught yourself saying this? 🌿✨ #Shorts #ChiroOne";
const DESCRIPTION = `At ChiroOne Gold Coast, we believe you shouldn't have to organize your life around pain. 🌿✨ Link in bio to book your initial functional health evaluation.\n\n#ChiroOne #GoldCoast #Chiropractic #Health #Wellness`;

async function uploadToYoutube() {
  try {
    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY || "" });

    console.log("1. Descargando video en memoria...");
    const vidRes = await fetch(VIDEO_URL);
    const arrayBuffer = await vidRes.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);
    const mimetype = "video/mp4";
    console.log(`✅ Video descargado. Tamaño: ${videoBuffer.length} bytes`);

    console.log("2. Generando Firma S3 Interna de Composio...");
    const contentB64 = videoBuffer.toString("base64");
    const md5Str = crypto.createHash("md5").update(Buffer.from(contentB64, "base64")).digest("hex");
    const extension = mimetype.split("/")[1] || "bin";
    const filename = `YOUTUBE_MULTIPART_UPLOAD_VIDEO_${Date.now()}.${extension}`;
    const actionName = "YOUTUBE_MULTIPART_UPLOAD_VIDEO";
    
    // Llamamos DIRECTAMENTE a la API de Composio en su backend usando fetch/axios
    const presignRes = await axios.post(
      "https://backend.composio.dev/api/v1/files/request_url", // Most composio tools are v1
      // actually, their error said "v3 APIs". Let's use v1/files because it matches what's in their python SDK. Wait, I will try "/api/v1/files" or "/api/v1/auth" what is v3? wait I will pass /v3/actions/files/upload/request first since that was the old structure. 
    );
      {
        headers: {
          "x-api-key": process.env.COMPOSIO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const data = presignRes.data;
    const signedURL = data.url;
    const s3key = data.key;
    console.log(`✅ URL Prefirmada S3 obtenida. S3Key: ${s3key}`);

    console.log("3. Subiendo archivo a la URL de S3 de Composio...");
    await axios.put(signedURL, Buffer.from(contentB64, "base64"), {
        headers: {
            "Content-Type": mimetype,
            "Content-Length": videoBuffer.length,
        },
    });
    console.log("✅ Archivo subido con éxito al Storage intermedio de Composio!");

    console.log("4. Ejecutando YOUTUBE_MULTIPART_UPLOAD_VIDEO de Composio...");
    const toolResult: any = await composio.actions.execute("YOUTUBE_MULTIPART_UPLOAD_VIDEO", {
        title: TITLE,
        description: DESCRIPTION,
        categoryId: "22",
        privacyStatus: "private",
        tags: ["chiropractor", "goldcoast", "health"],
        videoFile: { 
            name: filename, 
            mimetype: mimetype, 
            s3key: s3key 
        }
    }, YOUTUBE_CONNECTED_ACCOUNT_ID);

    console.log("\n🚀 ¡Resultado de Publicación desde la Cola de Composio!");
    console.log(JSON.stringify(toolResult, null, 2));

  } catch (error: any) {
    console.error("Error crítico:", error.response?.data || error.message || error);
    if (error.response?.data) {
       console.log("Status Http:", error.response.status);
    }
  }
}

uploadToYoutube();
