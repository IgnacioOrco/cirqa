import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imgsDir = path.resolve('public/Imgs');
const files = fs.readdirSync(imgsDir).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png')).sort();

async function buildMatrix() {
  const list = [];
  
  for (const f of files) {
    const filePath = path.join(imgsDir, f);
    const img = sharp(filePath);
    const meta = await img.metadata();
    const w = meta.width;
    const h = meta.height;

    // Sample raw pixel data
    const rawBuffer = await img.ensureAlpha().raw().toBuffer();
    
    // Find bounding box
    let minX = w, maxX = 0, minY = h, maxY = 0;
    for (let y = 0; y < h; y += 8) {
      for (let x = 0; x < w; x += 8) {
        const idx = (y * w + x) * 4;
        const r = rawBuffer[idx];
        const g = rawBuffer[idx + 1];
        const b = rawBuffer[idx + 2];
        if (r < 235 || g < 235 || b < 235) {
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

    // Sample lens center
    const sampleBox = (sx, sy, rad = 30) => {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = -rad; dy <= rad; dy += 4) {
        for (let dx = -rad; dx <= rad; dx += 4) {
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

    // Left and right lens samples
    const leftLens = sampleBox(Math.floor(centerX - boxW * 0.22), centerY);
    const rightLens = sampleBox(Math.floor(centerX + boxW * 0.22), centerY);
    const [lr, lg, lb] = leftLens;
    const [rr, rg, rb] = rightLens;
    const avgR = (lr + rr) / 2;
    const avgG = (lg + rg) / 2;
    const avgB = (lb + rb) / 2;

    // Detect lens filter
    let filter = 'clear';
    if (avgR > 70 && avgG < 40 && avgB < 40) {
      filter = 'noche';
    } else if (avgR > 180 && avgG > 60 && avgG < 155 && avgB < 60) {
      filter = 'transicion';
    } else if (avgR > 180 && avgG >= 155 && avgB < 100) {
      filter = 'dia';
    } else {
      filter = 'clear';
    }

    // Determine angle / shoot type:
    // Flat lay (top angle, temples spread inside or behind): minX/maxX ratio vs boxH, or position in file sequence
    // Front eye-level: boxH is relatively small and bridge is vertical
    // 3/4 Perspective: asymmetrical left vs right lens, or file >= _DSC8678
    let angle = 'top';
    const num = parseInt(f.replace(/[^0-9]/g, ''));
    if (num <= 8631) {
      angle = 'cenital'; // flat lay
    } else if (num <= 8676) {
      angle = 'frente'; // front eye-level
    } else {
      angle = 'perspectiva'; // 3/4 perspective
    }

    // Sample frame color (top rim)
    const rimSample = sampleBox(Math.floor(centerX - boxW * 0.22), Math.floor(centerY - boxH * 0.35), 15);
    const [fr, fg, fb] = rimSample;
    let frameColor = 'matte-black';
    if (fr > 190 && fg > 190 && fb > 190) {
      frameColor = 'crystal-clear';
    } else if (fr > 150 && fg > 100 && fb < 90) {
      frameColor = 'carey-havana';
    } else if (fr > 170 && fg < 160 && fb < 170) {
      frameColor = 'crystal-rose';
    }

    list.push({
      file: f,
      num,
      angle,
      filter,
      frameColor,
      lensRGB: [Math.round(avgR), Math.round(avgG), Math.round(avgB)],
      rimRGB: rimSample,
      aspectRatio: (boxW / boxH).toFixed(2),
      bbox: { minX, minY, maxX, maxY, boxW, boxH, centerX, centerY }
    });
  }

  fs.writeFileSync('scripts/photos_matrix.json', JSON.stringify(list, null, 2));
  console.log(`Matrix generated for ${list.length} photos.`);
}

buildMatrix().catch(console.error);
