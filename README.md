# CIRQA — Wellness Visual & Ritmo Circadiano

Plataforma digital interactiva y catálogo de e-commerce para **CIRQA**, marca de diseño óptico e ingeniería espectral para la regulación del ritmo circadiano y protección digital.

---

## 🚀 Tecnologías

- **React 18** + **Vite 6**
- **Tailwind CSS 3** (Sistema de diseño editorial y tokens de marca)
- **Framer Motion** (Animaciones cinemáticas, transiciones y scroll-jacking de fluid dynamic)
- **Lucide React** (Iconografía vectorial moderna)
- **Sharp** (Optimización y segmentación de fotografías de estudio)

---

## 🛠️ Instalación y Desarrollo Local

1. **Clonar repositorio**:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd Cirqa2
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   El sitio estará disponible en `http://localhost:5173/`.

4. **Compilar para producción**:
   ```bash
   npm run build
   ```

---

## 🌐 Despliegue en Vercel

El proyecto incluye la configuración [`vercel.json`](./vercel.json) para soportar enrutamiento SPA y encabezados de caché optimizados para assets WebP.

### Opción 1: Conectar con GitHub en el dashboard de Vercel (Recomendado)
1. Subir el proyecto a GitHub.
2. Ingresar a [Vercel](https://vercel.com/) e importar el repositorio.
3. Vercel detectará automáticamente Vite:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Hacer clic en **Deploy**.

### Opción 2: Usar Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 📦 Estructura del Proyecto

```
Cirqa2/
├── public/
│   ├── Imgs/          # Fotografías de estudio originales
│   ├── products/      # Fotos optimizadas con transparencia alfa WebP
│   └── assets/        # Renders y branding SVG
├── src/
│   ├── components/    # Componentes modulares de interfaz
│   ├── data/          # Modelos, cristales espectrales y mapeo fotográfico
│   ├── App.jsx        # Flujo principal de la página
│   ├── main.jsx       # Punto de entrada
│   └── index.css      # Configuración de estilos y fuentes
├── vercel.json        # Configuración de despliegue en Vercel
├── vite.config.js     # Configuración de Vite
└── tailwind.config.js # Paleta cromática oficial CIRQA
```
