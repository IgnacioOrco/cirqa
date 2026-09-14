import sharp from 'sharp';
import path from 'path';

const src = 'C:/Users/Admin/.gemini/antigravity-ide/brain/65f712f1-83a6-4f3a-9ad4-a81a665f6c1a/cirqa_hero_model_1787339940326.jpg';
const outPng = 'public/assets/hero-model.png';
const outWebp = 'public/assets/hero-model.webp';

async function processModelImage() {
  const image = sharp(src);
  const { width, height } = await image.metadata();

  const rawBuffer = await image.ensureAlpha().raw().toBuffer();
  
  // Flood fill / background alpha extraction
  const visited = new Uint8Array(width * height);
  const queue = [];

  const getIdx = (x, y) => (y * width + x);
  const getPixel = (x, y) => {
    const p = (y * width + x) * 4;
    return [rawBuffer[p], rawBuffer[p + 1], rawBuffer[p + 2], rawBuffer[p + 3]];
  };

  const isBg = (r, g, b, x, y) => {
    // Top-left softbox artifact: if x < 25% of width and y < 35% of height and it's dark/grey/white studio equipment
    if (x < width * 0.26 && y < height * 0.32) {
      if ((r < 60 && g < 60 && b < 60) || (r > 210 && g > 210 && b > 210)) {
        return true;
      }
    }
    // General studio off-white/light gray background
    const avg = (r + g + b) / 3;
    const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    return (avg >= 225 && diff < 18) || (avg >= 240);
  };

  // Seed top and side borders (excluding bottom where body continues)
  for (let x = 0; x < width; x++) {
    queue.push([x, 0]);
  }
  for (let y = 0; y < Math.floor(height * 0.7); y++) {
    queue.push([0, y]);
    queue.push([width - 1, y]);
  }

  while (queue.length > 0) {
    const [cx, cy] = queue.pop();
    const idx = getIdx(cx, cy);
    if (visited[idx]) continue;
    visited[idx] = 1;

    const [r, g, b] = getPixel(cx, cy);
    if (isBg(r, g, b, cx, cy)) {
      const p = idx * 4;
      const brightness = (r + g + b) / 3;
      if (brightness > 242 || (cx < width * 0.26 && cy < height * 0.32)) {
        rawBuffer[p + 3] = 0;
      } else {
        const factor = Math.max(0, Math.min(1, (brightness - 225) / (242 - 225)));
        rawBuffer[p + 3] = Math.max(0, Math.min(255, Math.floor((1 - factor) * 255)));
      }

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
            if (isBg(nr, ng, nb, nx, ny)) {
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
  }

  await sharp(rawBuffer, { raw: { width, height, channels: 4 } })
    .png({ quality: 95, compressionLevel: 8 })
    .toFile(outPng);

  await sharp(rawBuffer, { raw: { width, height, channels: 4 } })
    .webp({ quality: 92, alphaQuality: 95, effort: 6 })
    .toFile(outWebp);

  console.log('Model image processed successfully:', outPng, outWebp);
}

processModelImage().catch(console.error);
