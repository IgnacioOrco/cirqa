import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputDir = path.resolve('public/Imgs');
const outputDir = path.resolve('public/products');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png')).sort();

async function processAll() {
  console.log(`Optimizing ${files.length} product images...`);
  
  for (const f of files) {
    const srcPath = path.join(inputDir, f);
    const cleanName = f.replace(/\s+/g, '').replace(/\.jpg$/i, '');
    const outWebp = path.join(outputDir, `${cleanName}.webp`);
    
    // Read and trim near-white border with tolerance
    await sharp(srcPath)
      .trim({ background: '#FFFFFF', threshold: 12 })
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 85, effort: 4 })
      .toFile(outWebp);
  }
  
  console.log('All product images optimized to public/products/*.webp');
}

processAll().catch(console.error);
