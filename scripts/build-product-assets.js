import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imgsDir = path.resolve('public/Imgs');
const files = fs.readdirSync(imgsDir).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png')).sort();

async function analyzeAll() {
  const catalog = [];

  for (const f of files) {
    const filePath = path.join(imgsDir, f);
    const img = sharp(filePath);
    const meta = await img.metadata();
    const w = meta.width;
    const h = meta.height;

    // Get non-white bounding box
    // Sample raw pixel data
    const rawBuffer = await img.ensureAlpha().raw().toBuffer();
    let minX = w, maxX = 0, minY = h, maxY = 0;

    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        const idx = (y * w + x) * 4;
        const r = rawBuffer[idx];
        const g = rawBuffer[idx + 1];
        const b = rawBuffer[idx + 2];
        if (r < 240 || g < 240 || b < 240) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const boxW = maxX - minX;
    const boxH = maxY - minY;
    const centerX = Math.floor((minX + maxX) / 2);
    const centerY = Math.floor((minY + maxY) / 2);

    // Sample inside left lens (~centerX - boxW*0.22, centerY) and right lens (~centerX + boxW*0.22, centerY)
    const sampleLens = (sx, sy) => {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      const rad = 20;
      for (let dy = -rad; dy <= rad; dy += 2) {
        for (let dx = -rad; dx <= rad; dx += 2) {
          const px = sx + dx;
          const py = sy + dy;
          if (px >= 0 && px < w && py >= 0 && py < h) {
            const idx = (py * w + px) * 4;
            rSum += rawBuffer[idx];
            gSum += rawBuffer[idx + 1];
            bSum += rawBuffer[idx + 2];
            count++;
          }
        }
      }
      return [Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)];
    };

    const leftCol = sampleLens(Math.floor(centerX - boxW * 0.22), centerY);
    const rightCol = sampleLens(Math.floor(centerX + boxW * 0.22), centerY);
    const avgLens = [(leftCol[0] + rightCol[0]) / 2, (leftCol[1] + rightCol[1]) / 2, (leftCol[2] + rightCol[2]) / 2];

    // Detect filter type:
    // Red: r > 150, g < 60, b < 60
    // Orange: r > 200, g between 70 and 150, b < 70
    // Yellow: r > 200, g > 160, b < 70
    // Clear: r > 200, g > 200, b > 200
    let filter = 'clear';
    const [lr, lg, lb] = avgLens;
    if (lr > 130 && lg < 50 && lb < 50) {
      filter = 'noche';
    } else if (lr > 190 && lg >= 50 && lg <= 165 && lb < 80) {
      filter = 'transicion';
    } else if (lr > 190 && lg > 165 && lb < 100) {
      filter = 'dia';
    } else if (lr > 210 && lg > 210 && lb > 210) {
      filter = 'clear';
    }

    catalog.push({
      file: f,
      bbox: { minX, minY, maxX, maxY, boxW, boxH, centerX, centerY },
      lensRGB: [Math.round(lr), Math.round(lg), Math.round(lb)],
      filter,
      aspectRatio: (boxW / boxH).toFixed(2)
    });
  }

  fs.writeFileSync('scripts/catalog_classified.json', JSON.stringify(catalog, null, 2));
  console.log('Classified all images. Sample:', catalog.slice(0, 10));
}

analyzeAll().catch(console.error);
