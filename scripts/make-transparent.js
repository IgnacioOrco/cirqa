import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputDir = path.resolve('public/Imgs');
const outputDir = path.resolve('public/products');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png')).sort();

async function processImage(f) {
  const srcPath = path.join(inputDir, f);
  const cleanName = f.replace(/\s+/g, '').replace(/\.jpg$/i, '');
  const outWebp = path.join(outputDir, `${cleanName}.webp`);

  // Load raw image data
  const { data, info } = await sharp(srcPath)
    .resize({ width: 1200, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixelCount = width * height;

  // Process pixels to make studio white / light grey background fully transparent
  // We compute luminosity and Euclidean distance from pure white (255, 255, 255)
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Check if pixel is near-white background
    const minVal = Math.min(r, g, b);
    const maxVal = Math.max(r, g, b);
    const saturation = maxVal === 0 ? 0 : (maxVal - minVal) / maxVal;

    // Studio background is very high brightness (minVal > 230) and very low saturation (< 0.15)
    // Note: Lenses (red, yellow, orange) have high saturation, so they are fully preserved!
    if (minVal >= 235 && saturation < 0.12) {
      if (minVal >= 248) {
        data[idx + 3] = 0; // 100% transparent
      } else {
        // Smooth linear alpha ramp between 235 and 248 for soft anti-aliased edge
        const alphaFraction = (248 - minVal) / (248 - 235);
        data[idx + 3] = Math.round(alphaFraction * 255);
      }
    }
  }

  // Save back as clean transparent WebP trimmed
  await sharp(data, {
    raw: {
      width,
      height,
      channels,
    },
  })
    .trim({ threshold: 5 })
    .webp({ quality: 90, effort: 4 })
    .toFile(outWebp);
}

async function run() {
  console.log(`Processing ${files.length} images for alpha transparency...`);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    await processImage(file);
    if ((i + 1) % 10 === 0 || i === files.length - 1) {
      console.log(`Progress: ${i + 1}/${files.length}`);
    }
  }
  console.log('Finished creating clean transparent product assets!');
}

run().catch(console.error);
