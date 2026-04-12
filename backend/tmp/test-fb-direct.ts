import "dotenv/config";

const FB_PAGE_ID = "343192448887259";
const PAGE_ACCESS_TOKEN = "EAAM4uULUpAUBRGGZBz0HW2w9ClQjzB67QVwOqYUZCwvDqYethelc9kgCWGBdWwcPta4yboCmBuq94vL3uX3sEuxINDBYzfoVFRQOA6NJmgG8iZCgJvioXZCzhBiBItciKVxFWJBBn7zcanZAX6uvRhI9owzPzuL6ZB3fxl68LAgl3xUxXZBPh5fbQpMRbJcPZCKEmeiba8IVNdH43VuIVkj5";

async function testVideoPost() {
  const videoUrl = "https://tempfile.aiquickdraw.com/g/users/760594ce-4ca9-4fd4-b787-523966a5b814/generated/818862f5-ffeb-4cb2-a463-4db81093bd38/generated_video.mp4";
  const description = `Have you caught yourself saying, "I guess this is just my life now"? At ChiroOne Gold Coast, we believe you shouldn't need to organize your life around pain. Whether it's a persistent ache in your lower back or tension headaches, our holistic approach is designed to help you find sustainable relief. 🌿✨ Link in bio to book your initial functional health evaluation.`;
  const title = "El mito de vivir con dolor (Pilar: Creencias)";

  console.log("[FB Direct] Posting video via Graph API...");

  const body = new URLSearchParams({
    file_url: videoUrl,
    description,
    title,
    published: "true",
    access_token: PAGE_ACCESS_TOKEN,
  });

  const res = await fetch(`https://graph.facebook.com/v20.0/${FB_PAGE_ID}/videos`, {
    method: "POST",
    body,
  });

  const json = await res.json();

  if (res.ok) {
    console.log("✅ Video posted successfully!");
    console.log(JSON.stringify(json, null, 2));
  } else {
    console.error("❌ Failed:");
    console.log(JSON.stringify(json, null, 2));
  }
}

testVideoPost().catch(console.error);
