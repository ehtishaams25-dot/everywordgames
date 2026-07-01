import fs from "fs";
import path from "path";
import sharp from "sharp";

const ARTWORK_DIR = path.resolve("public/pokemon/artwork");
const SILHOUETTE_DIR = path.resolve("public/pokemon/silhouettes");

if (!fs.existsSync(SILHOUETTE_DIR)) {
  fs.mkdirSync(SILHOUETTE_DIR, { recursive: true });
}

async function generateSilhouettes() {
  if (!fs.existsSync(ARTWORK_DIR)) {
    console.error("Artwork directory does not exist! Run fetch-pokemon.ts first.");
    return;
  }

  const files = fs.readdirSync(ARTWORK_DIR).filter((f) => f.endsWith(".png"));
  console.log(`Found ${files.length} artwork images. Generating silhouettes...`);

  let count = 0;
  for (const file of files) {
    const inputPath = path.join(ARTWORK_DIR, file);
    const outputPath = path.join(SILHOUETTE_DIR, file);

    try {
      const { data, info } = await sharp(inputPath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Convert visible pixels to solid black (#000000) preserving alpha
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 15) {
          data[i] = 0;     // R
          data[i + 1] = 0; // G
          data[i + 2] = 0; // B
          // keep alpha as is
        } else {
          data[i + 3] = 0; // clear faint noise
        }
      }

      await sharp(data, {
        raw: { width: info.width, height: info.height, channels: 4 },
      })
        .png()
        .toFile(outputPath);

      count++;
      if (count % 25 === 0 || count === files.length) {
        console.log(`Generated ${count} / ${files.length} silhouettes.`);
      }
    } catch (err) {
      console.error(`Failed to generate silhouette for ${file}:`, err);
    }
  }

  console.log(`Successfully generated ${count} silhouettes in public/pokemon/silhouettes.`);
}

generateSilhouettes();
