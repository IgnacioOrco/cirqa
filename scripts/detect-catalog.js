import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imgsDir = path.resolve('public/Imgs');
const files = fs.readdirSync(imgsDir).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png')).sort();

async function fullCatalog() {
  const list = [];
  for (const f of files) {
    const filePath = path.join(imgsDir, f);
    const img = sharp(filePath);
    const meta = await img.metadata();
    
    // Check bounding box / non-white area
    // Sample colors in left lens, right lens, bridge, temples
    const w = meta.width;
    const h = meta.height;
    
    // Left lens center sample (~35% w, 50% h)
    const leftLens = await sharp(filePath)
      .extract({ left: Math.floor(w * 0.3), top: Math.floor(h * 0.45), width: Math.floor(w * 0.1), height: Math.floor(h * 0.1) })
      .stats();
    
    // Right lens center sample (~65% w, 50% h)
    const rightLens = await sharp(filePath)
      .extract({ left: Math.floor(w * 0.6), top: Math.floor(h * 0.45), width: Math.floor(w * 0.1), height: Math.floor(h * 0.1) })
      .stats();

    const [lr, lg, lb] = leftLens.channels.map(c => Math.round(c.mean));
    const [rr, rg, rb] = rightLens.channels.map(c => Math.round(c.mean));

    // Frame material/color: sample near top-center or upper rim
    const topRim = await sharp(filePath)
      .extract({ left: Math.floor(w * 0.35), top: Math.floor(h * 0.38), width: Math.floor(w * 0.05), height: Math.floor(w * 0.05) })
      .stats();
    const [fr, fg, fb] = topRim.channels.map(c => Math.round(c.mean));

    // Lens filter detection
    const avgR = (lr + rr) / 2;
    const avgG = (lg + rg) / 2;
    const avgB = (lb + rb) / 2;

    let lensType = 'clear';
    if (avgR > 200 && avgG < 60 && avgB < 60) {
      lensType = 'noche (rojo)';
    } else if (avgR > 210 && avgG > 90 && avgG < 180 && avgB < 60) {
      lensType = 'transicion (naranja)';
    } else if (avgR > 210 && avgG > 180 && avgB < 80) {
      lensType = 'dia (amarillo)';
    } else if (avgR > 220 && avgG > 220 && avgB > 220) {
      lensType = 'clear';
    } else if (avgR > 180 && avgB < 100) {
      lensType = 'transicion/dia';
    } else if (avgR > 140 && avgG < 50) {
      lensType = 'noche (rojo)';
    }

    list.push({
      file: f,
      leftLensRGB: [lr, lg, lb],
      rightLensRGB: [rr, rg, rb],
      lensType,
      topRimRGB: [fr, fg, fb]
    });
  }

  fs.writeFileSync('scripts/catalog_detected.json', JSON.stringify(list, null, 2));
  console.log('Detected', list.length, 'images.');
}

fullCatalog().catch(console.error);
