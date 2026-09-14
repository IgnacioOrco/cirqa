import fs from 'fs';
import path from 'path';

const imgsDir = path.resolve('public/Imgs');
const files = fs.readdirSync(imgsDir).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png')).sort();

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cirqa Image Catalog</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #111; color: #fff; margin: 0; padding: 20px; }
    h1 { font-size: 20px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .card { background: #222; border-radius: 8px; overflow: hidden; padding: 8px; text-align: center; }
    img { width: 100%; height: 180px; object-fit: contain; background: #fff; border-radius: 4px; }
    .name { margin-top: 8px; font-size: 13px; font-family: monospace; color: #ddd; word-break: break-all; }
  </style>
</head>
<body>
  <h1>CIRQA - Catálogo de Fotos (${files.length} imágenes)</h1>
  <div class="grid">
    ${files.map(f => `
      <div class="card">
        <img src="/Imgs/${encodeURIComponent(f)}" loading="lazy" alt="${f}" />
        <div class="name">${f}</div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

fs.writeFileSync('public/catalog.html', html);
console.log('Created public/catalog.html with', files.length, 'images.');
