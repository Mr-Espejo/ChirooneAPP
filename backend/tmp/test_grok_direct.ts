import { generateVideoTask } from "../triggers/videoGeneration.js";
import "dotenv/config";

async function testGrokVideo() {
  const postId = "48c61ff3-7daa-4585-a79a-b8c80964f4d4";
  const imageUrl = "https://tempfile.aiquickdraw.com/image-format-converter/1775923585957-8anqjpjqlyb.jpg";
  const videoPrompt = "Las olas rompen suavemente en el fondo desenfocado, la brisa mueve ligeramente el cabello de la mujer, la cámara hace un sutil y lento acercamiento (slow zoom in) hacia su rostro relajado.";
  const companyId = "my-company-id";

  console.log(`🚀 Inciando prueba de Grok para Post: ${postId}`);
  
  await generateVideoTask.trigger({
    postId,
    imageUrl,
    prompt: videoPrompt,
    companyId
  });

  console.log("✅ Tarea enviada a Trigger.dev. Revisa tu dashboard o la terminal de npx trigger.dev dev.");
}

testGrokVideo();
