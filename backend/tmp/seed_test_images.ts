import fs from "node:fs";
import path from "node:path";

const DB_PATH = "c:/Users/andre/Downloads/DocsDhiroOne/ChiorooneContent/tmp/db.json";

const TEST_IMAGES = [
  "https://images.unsplash.com/photo-1594412090532-af11c6d3692b.jpg",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b.jpg",
  "https://images.unsplash.com/photo-1579126038827-7755f69c01c6.jpg",
  "https://images.unsplash.com/photo-1593005510329-8a4035a7238f.jpg",
  "https://images.unsplash.com/photo-1518310383802-640c2de311b2.jpg",
  "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc.jpg",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b.jpg"
];

async function seed() {
  if (!fs.existsSync(DB_PATH)) {
    console.log("DB not found at", DB_PATH);
    return;
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  
  db.forEach((post, index) => {
    post.media_url = TEST_IMAGES[index % TEST_IMAGES.length];
    post.status = "WAITING_FOR_VIDEO";
    console.log(`Seeded Day ${index + 1}: ${post.headline}`);
  });

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log("Database seeded with test images and set to WAITING_FOR_VIDEO.");
}

seed();
