import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imgsDir = path.resolve('public/Imgs');
const files = fs.readdirSync(imgsDir).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png'));

async function analyze() {
  const results = [];
  for (const f of files) {
    const filePath = path.join(imgsDir, f);
    const img = sharp(filePath);
    const meta = await img.metadata();
    const stats = await img.stats();
    
    // dominant channels
    const [r, g, b] = stats.channels.map(c => Math.round(c.mean));
    results.push({
      file: f,
      width: meta.width,
      height: meta.height,
      meanR: r,
      meanG: g,
      meanB: b,
      sizeKB: Math.round(fs.statSync(filePath).size / 1024)
    });
  }
  
  console.log(JSON.stringify(results, null, 2));
}

analyze().catch(console.error);
