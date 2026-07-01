import fs from "fs";
import path from "path";
import sharp from "sharp";

const PUBLIC_DIR = path.resolve("public");

async function generateSilhouettesForEntity(entityName: string) {
  const artworkDir = path.join(PUBLIC_DIR, entityName, "artwork");
  const silhouetteDir = path.join(PUBLIC_DIR, entityName, "silhouettes");

  if (!fs.existsSync(artworkDir)) {
    console.log(`No artwork directory found for ${entityName}, skipping.`);
    return;
  }

  if (!fs.existsSync(silhouetteDir)) {
    fs.mkdirSync(silhouetteDir, { recursive: true });
  }

  const files = fs.readdirSync(artworkDir).filter((f) => /\.(png|webp|jpg|jpeg)$/i.test(f));
  console.log(`Found ${files.length} artwork images for ${entityName}. Generating silhouettes...`);

  let count = 0;
  for (const file of files) {
    const inputPath = path.join(artworkDir, file);
    const outputPath = path.join(silhouetteDir, file);

    try {
      const { data, info } = await sharp(inputPath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Convert visible pixels to 100% solid black (#000000, alpha 255) to avoid gray AI matte smoke/halos
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 30) {
          data[i] = 0;     // R
          data[i + 1] = 0; // G
          data[i + 2] = 0; // B
          data[i + 3] = 255; // 100% solid black! Zero gray smog or semi-transparency!
        } else {
          data[i + 3] = 0; // 0% transparent! Remove all AI background blur and smog!
        }
      }

      const isWebp = file.toLowerCase().endsWith(".webp");
      const sharpInstance = sharp(data, {
        raw: { width: info.width, height: info.height, channels: 4 },
      });

      if (isWebp) {
        await sharpInstance.webp({ quality: 85 }).toFile(outputPath);
      } else {
        await sharpInstance.png().toFile(outputPath);
      }

      count++;
      if (count % 50 === 0 || count === files.length) {
        console.log(`[${entityName}] Generated ${count} / ${files.length} silhouettes.`);
      }
    } catch (err) {
      console.error(`Failed to generate silhouette for ${file}:`, err);
    }
  }

  console.log(`Successfully generated ${count} silhouettes in public/${entityName}/silhouettes.`);
}

async function main() {
  const targetEntity = process.argv[2];
  if (targetEntity) {
    await generateSilhouettesForEntity(targetEntity);
    return;
  }

  // Auto-discover all entity folders inside public/
  const items = fs.readdirSync(PUBLIC_DIR, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      const artDir = path.join(PUBLIC_DIR, item.name, "artwork");
      if (fs.existsSync(artDir)) {
        await generateSilhouettesForEntity(item.name);
      }
    }
  }
}

main().catch((err) => {
  console.error("Error generating silhouettes:", err);
  process.exit(1);
});
