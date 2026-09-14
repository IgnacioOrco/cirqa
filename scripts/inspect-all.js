import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imgsDir = path.resolve('public/Imgs');
const files = fs.readdirSync(imgsDir).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png'));

async function inspectAll() {
  const data = [];
  
  for (const f of files) {
    const filePath = path.join(imgsDir, f);
    const img = sharp(filePath);
    const meta = await img.metadata();
    
    // Extract center 40% area where the lens / frame is
    const centerSize = Math.floor(meta.width * 0.4);
    const centerLeft = Math.floor((meta.width - centerSize) / 2);
    const centerTop = Math.floor((meta.height - centerSize) / 2);
    
    const centerStats = await sharp(filePath)
      .extract({ left: centerLeft, top: centerTop, width: centerSize, height: centerSize })
      .stats();
      
    const [cr, cg, cb] = centerStats.channels.map(c => Math.round(c.mean));
    
    // Check if red-ish, yellow-ish, orange-ish, neutral/clear
    let guessedType = 'unknown';
    if (cr > 235 && cg > 235 && cb > 235) {
      guessedType = 'clear/neutral';
    } else if (cr > cg + 20 && cg > cb + 10) {
      guessedType = 'orange/transicion';
    } else if (cr > cg + 15 && cb < 210 && Math.abs(cg - cb) < 20) {
      guessedType = 'red/noche';
    } else if (cg > 225 && cr > 235 && cb < 225) {
      guessedType = 'yellow/dia';
    }
    
    data.push({
      file: f,
      centerRGB: [cr, cg, cb],
      guessedType
    });
  }
  
  console.log(JSON.stringify(data, null, 2));
}

inspectAll().catch(console.error);
