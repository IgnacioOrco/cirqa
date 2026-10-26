import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const assetsDir = path.resolve('public/assets');

async function optimizeImages() {
  const images = [
    { src: 'HOME SLIDER 1A.jpg', baseName: 'home-slider-1a', maxW: 1200, mobileW: 640 },
    { src: 'HOME SLIDER 1B.jpg', baseName: 'home-slider-1b', maxW: 1200, mobileW: 640 },
    { src: 'HOME SLIDER 1C.jpg', baseName: 'home-slider-1c', maxW: 1200, mobileW: 640 },
    { src: 'MANIFIESTO 1.jpg', baseName: 'manifiesto-1', maxW: 1200, mobileW: 640 },
    { src: 'MANIFIESTO 2.jpg', baseName: 'manifiesto-2', maxW: 1200, mobileW: 640 },
    { src: 'MANIFIESTO 3.jpg', baseName: 'manifiesto-3', maxW: 1200, mobileW: 640 },
    { src: 'MANIFIESTO 4.jpg', baseName: 'manifiesto-4', maxW: 1200, mobileW: 640 },
    { src: 'SITUACIONES AMARILLO.jpg', baseName: 'situaciones-amarillo', maxW: 1000, mobileW: 600 },
    { src: 'SITUACIONES NARANJA.jpg', baseName: 'situaciones-naranja', maxW: 1000, mobileW: 600 },
    { src: 'SITUACIONES ROJO.jpg', baseName: 'situaciones-rojo', maxW: 1000, mobileW: 600 }
  ];

  console.log('Optimizing images...');
  for (const item of images) {
    const inputPath = path.join(assetsDir, item.src);
    if (!fs.existsSync(inputPath)) {
      console.warn(`File not found: ${inputPath}`);
      continue;
    }

    const origStats = fs.statSync(inputPath);
    console.log(`\nProcessing ${item.src} (${Math.round(origStats.size / 1024)} KB)...`);

    // Desktop WebP
    const outDesktop = path.join(assetsDir, `${item.baseName}.webp`);
    await sharp(inputPath)
      .resize({ width: item.maxW, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(outDesktop);
    const deskStats = fs.statSync(outDesktop);
    console.log(`  -> Desktop WebP: ${Math.round(deskStats.size / 1024)} KB`);

    // Mobile WebP (Alineado a pantallas retina móviles sin sobredescarga)
    const outMobile = path.join(assetsDir, `${item.baseName}-mobile.webp`);
    await sharp(inputPath)
      .resize({ width: item.mobileW, withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toFile(outMobile);
    const mobStats = fs.statSync(outMobile);
    console.log(`  -> Mobile WebP: ${Math.round(mobStats.size / 1024)} KB`);
  }

  console.log('\nAll images processed successfully!');
}

optimizeImages().catch(err => {
  console.error(err);
  process.exit(1);
});
