import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('public/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const images = [
  {
    src: 'C:/Users/Admin/.gemini/antigravity-ide/brain/65f712f1-83a6-4f3a-9ad4-a81a665f6c1a/cirqa_dia_asset_1787338696450.jpg',
    outPng: 'public/assets/lens-dia.png',
    outWebp: 'public/assets/lens-dia.webp'
  },
  {
    src: 'C:/Users/Admin/.gemini/antigravity-ide/brain/65f712f1-83a6-4f3a-9ad4-a81a665f6c1a/cirqa_trans_asset_1787338739176.jpg',
    outPng: 'public/assets/lens-transicion.png',
    outWebp: 'public/assets/lens-transicion.webp'
  },
  {
    src: 'C:/Users/Admin/.gemini/antigravity-ide/brain/65f712f1-83a6-4f3a-9ad4-a81a665f6c1a/cirqa_noche_asset_1787338806342.jpg',
    outPng: 'public/assets/lens-noche.png',
    outWebp: 'public/assets/lens-noche.webp'
  }
];

async function processImage({ src, outPng, outWebp }) {
  console.log('Processing:', src);
  const image = sharp(src);
  const { width, height } = await image.metadata();

  // Extract raw RGBA buffer
  const rawBuffer = await image.ensureAlpha().raw().toBuffer();
  
  // Flood fill / exterior white detection from borders
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Helper to get index
  const getIdx = (x, y) => (y * width + x);
  const getPixel = (x, y) => {
    const p = (y * width + x) * 4;
    return [rawBuffer[p], rawBuffer[p + 1], rawBuffer[p + 2], rawBuffer[p + 3]];
  };

  const isWhiteBg = (r, g, b) => {
    // White or near-white background
    return (r >= 238 && g >= 238 && b >= 238) || (r > 220 && g > 220 && b > 220 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8);
  };

  // Seed exterior borders
  for (let x = 0; x < width; x++) {
    queue.push([x, 0]);
    queue.push([x, height - 1]);
  }
  for (let y = 0; y < height; y++) {
    queue.push([0, y]);
    queue.push([width - 1, y]);
  }

  while (queue.length > 0) {
    const [cx, cy] = queue.pop();
    const idx = getIdx(cx, cy);
    if (visited[idx]) continue;
    visited[idx] = 1;

    const [r, g, b] = getPixel(cx, cy);
    if (isWhiteBg(r, g, b)) {
      // It's background: make transparent
      const p = idx * 4;
      // Smooth edge feather
      const brightness = (r + g + b) / 3;
      if (brightness > 248) {
        rawBuffer[p + 3] = 0;
      } else {
        const factor = (brightness - 220) / (248 - 220);
        rawBuffer[p + 3] = Math.max(0, Math.min(255, Math.floor((1 - factor) * 255)));
      }

      // Check neighbors
      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = getIdx(nx, ny);
          if (!visited[nIdx]) {
            const [nr, ng, nb] = getPixel(nx, ny);
            if (isWhiteBg(nr, ng, nb)) {
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
  }

  // Also clean up any isolated near-pure white background pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = getIdx(x, y);
      const p = idx * 4;
      const r = rawBuffer[p];
      const g = rawBuffer[p + 1];
      const b = rawBuffer[p + 2];
      if (r > 250 && g > 250 && b > 250 && visited[idx]) {
        rawBuffer[p + 3] = 0;
      }
    }
  }

  // Save to PNG and WebP
  await sharp(rawBuffer, { raw: { width, height, channels: 4 } })
    .trim()
    .png({ quality: 95, compressionLevel: 8 })
    .toFile(outPng);

  await sharp(rawBuffer, { raw: { width, height, channels: 4 } })
    .trim()
    .webp({ quality: 92, alphaQuality: 95, effort: 6 })
    .toFile(outWebp);

  console.log('Saved:', outPng, outWebp);
}

async function run() {
  for (const img of images) {
    await processImage(img);
  }
}

run().catch(console.error);
