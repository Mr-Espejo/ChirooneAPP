import "dotenv/config";
import express from 'express';
import { google } from 'googleapis';
import fetch from "node-fetch";
import stream from "stream";

const app = express();
const PORT = 3456;

// Debes obtener esto desde Google Cloud Console (APIs & Services -> Credentials)
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || "TU_CLIENT_ID_AQUI";
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || "TU_CLIENT_SECRET_AQUI";
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;

const VIDEO_URL = "https://tempfile.aiquickdraw.com/g/users/760594ce-4ca9-4fd4-b787-523966a5b814/generated/818862f5-ffeb-4cb2-a463-4db81093bd38/generated_video.mp4";
const TITLE = "Have you caught yourself saying this? 🌿✨ #Shorts #ChiroOne";
const DESCRIPTION = `At ChiroOne Gold Coast, we believe you shouldn't have to organize your life around pain...`;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly'
];

app.get('/login', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  console.log(`[YouTube OAuth] Redirigiendo a YouTube para Auth...`);
  res.redirect(url);
});

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code as string;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log("[YouTube OAuth] Éxito! Tokens obtenidos:", tokens);
    res.send("<h1>Autenticación exitosa!</h1><p>Revisa la terminal para ver el progreso de subida.</p>");
    
    // Iniciar el proceso de subida directamente
    await uploadVideo(oauth2Client);

  } catch (error) {
    console.error('Error al intercambiar el token:', error);
    res.status(500).send('Authentication failed');
  }
});

async function uploadVideo(auth: any) {
    const youtube = google.youtube({ version: 'v3', auth });

    try {
        console.log("\n[YouTube Upload] 1. Descargando video temporal localmente...");
        const vidRes = await fetch(VIDEO_URL);
        const arrayBuffer = await vidRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);

        console.log(`[YouTube Upload] 2. Iniciando subida del archivo (${buffer.length} bytes)...`);
        
        const res = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title: TITLE,
                    description: DESCRIPTION,
                    tags: ['chiropractor', 'goldcoast', 'health'],
                    categoryId: '22'
                },
                status: {
                    privacyStatus: 'private', 
                    selfDeclaredMadeForKids: false
                }
            },
            media: {
                body: bufferStream
            }
        });

        console.log('\n[YouTube Upload] ✅ ¡ÉXITO! Video subido correctamente');
        console.log('Video ID:', res.data.id);
        console.log('Video URL:', `https://youtube.com/shorts/${res.data.id}`);
        console.log('Detalles:', JSON.stringify(res.data.snippet, null, 2));

        process.exit(0);
    } catch (error: any) {
        console.error('\n[YouTube Upload] ❌ Error en la subida:', error.errors || error.message || error);
        process.exit(1);
    }
}

app.listen(PORT, () => {
  console.log(`🚀 YouTube Local Auth Server listo.`);
  console.log(`Abre en tu navegador para empezar: http://127.0.0.1:${PORT}/login`);
});
