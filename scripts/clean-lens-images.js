import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('public/assets');

const targets = [
  'lens-dia',
  'lens-transicion',
  'lens-noche',
];

async function cleanImage(name) {
  const pngPath = path.join(assetsDir, `${name}.png`);
  const webpPath = path.join(assetsDir, `${name}.webp`);

  if (!fs.existsSync(pngPath)) {
    console.error(`File not found: ${pngPath}`);
    return;
  }

  const { data, info } = await sharp(pngPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = [];

  const getIdx = (x, y) => y * width + x;

  // Push all perimeter pixels to the queue
  for (let x = 0; x < width; x++) {
    queue.push([x, 0]);
    queue.push([x, height - 1]);
  }
  for (let y = 0; y < height; y++) {
    queue.push([0, y]);
    queue.push([width - 1, y]);
  }

  const isBgPixel = (r, g, b, a) => {
    // Already transparent or semi-transparent
    if (a < 200) return true;

    // Light studio background: high brightness and low color saturation
    const minVal = Math.min(r, g, b);
    const maxVal = Math.max(r, g, b);
    const saturation = maxVal === 0 ? 0 : (maxVal - minVal) / maxVal;

    // Frame is dark (r,g,b < 100), lenses are saturated (saturation > 0.35)
    // Studio background is minVal >= 210 and saturation < 0.12
    return minVal >= 210 && saturation < 0.12;
  };

  while (queue.length > 0) {
    const [cx, cy] = queue.pop();
    const idx = getIdx(cx, cy);
    if (visited[idx]) continue;
    visited[idx] = 1;

    const p = idx * 4;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const a = data[p + 3];

    if (isBgPixel(r, g, b, a)) {
      // Mark as 100% transparent background
      data[p + 3] = 0;

      // Expand to 4-way neighbors
      if (cx > 0 && !visited[getIdx(cx - 1, cy)]) queue.push([cx - 1, cy]);
      if (cx < width - 1 && !visited[getIdx(cx + 1, cy)]) queue.push([cx + 1, cy]);
      if (cy > 0 && !visited[getIdx(cx, cy - 1)]) queue.push([cx, cy - 1]);
      if (cy < height - 1 && !visited[getIdx(cx, cy + 1)]) queue.push([cx, cy + 1]);
    }
  }

  // Soft edge cleanup: for any pixels adjacent to 0 alpha that are near-white, feather them
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = getIdx(x, y);
      const p = idx * 4;
      if (data[p + 3] > 0) {
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const minVal = Math.min(r, g, b);
        const maxVal = Math.max(r, g, b);
        const saturation = maxVal === 0 ? 0 : (maxVal - minVal) / maxVal;

        // If it's near-white and next to an empty pixel, fade it
        if (minVal >= 200 && saturation < 0.10) {
          const hasEmptyNeighbor =
            data[getIdx(x - 1, y) * 4 + 3] === 0 ||
            data[getIdx(x + 1, y) * 4 + 3] === 0 ||
            data[getIdx(x, y - 1) * 4 + 3] === 0 ||
            data[getIdx(x, y + 1) * 4 + 3] === 0;

          if (hasEmptyNeighbor) {
            data[p + 3] = 0;
          }
        }
      }
    }
  }

  // Save clean PNG and WebP
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ quality: 95 })
    .toFile(pngPath + '.tmp');

  fs.renameSync(pngPath + '.tmp', pngPath);

  await sharp(data, { raw: { width, height, channels: 4 } })
    .webp({ quality: 92, alphaQuality: 100, effort: 5 })
    .toFile(webpPath);

  console.log(`Cleaned and saved: ${name}.png & ${name}.webp`);
}

async function main() {
  for (const name of targets) {
    await cleanImage(name);
  }
}

main().catch(console.error);
