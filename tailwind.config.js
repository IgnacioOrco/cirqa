/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cirqa: {
          negro: "#201610",     // Neutro Negro
          arena: "#E4B070",     // Arena
          blanco: "#FFFFFF",    // Neutro Blanco
          primario: "#E84A0F",  // Primario (Botones y CTAs)
          ocaso: "#4E120C",     // Ocaso
          carmin: "#AC1917",    // Carmín / Noche
          ambar: "#EFBA40",     // Ámbar
          amarillo: "#F3B93A",  // Amarillo / Día
          // Variantes tonales para UI
          surface: "#FBF9F6",
          darkSurface: "#19110C",
          border: "#E9E2D8",
          muted: "#7B6F66",
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0',
        wide: '0.04em',
        wider: '0.08em',
        widest: '0.14em',
      },
    },
  },
  plugins: [],
}
