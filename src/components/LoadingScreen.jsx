import React from 'react';
import { motion } from 'framer-motion';

/**
 * Pantalla de Carga Oficial CIRQA
 * - Fondo suave off-white unificado (#FAF9F5).
 * - Indicador de carga biomimético circadiano minimalista.
 * - Tipografía y detalles refinados acordes a la identidad de la marca.
 */
export default function LoadingScreen({ message = 'Cargando colección...' }) {
  return (
    <div className="min-h-screen w-full bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-cirqa-negro font-montserrat select-none relative overflow-hidden">
      {/* Resplandor ambiental de fondo */}
      <div className="absolute w-72 h-72 rounded-full bg-cirqa-primario/15 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center space-y-6"
      >
        {/* Spinner Circadiano Doble */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Anillo exterior */}
          <div className="absolute inset-0 rounded-full border-2 border-cirqa-negro/10" />
          {/* Arco rotatorio */}
          <div className="absolute inset-0 rounded-full border-2 border-cirqa-negro border-t-transparent animate-spin" />
          {/* Núcleo central pulsante */}
          <div className="w-4 h-4 rounded-full bg-cirqa-primario animate-pulse" />
        </div>

        {/* Tipografía de Identidad CIRQA */}
        <div className="space-y-1.5">
          <span className="text-[11px] uppercase tracking-[0.28em] font-semibold text-cirqa-negro/80 block">
            CIRQA · Biomimetic Optics
          </span>
          <p className="text-xs font-light text-cirqa-negro/50 tracking-wider">
            {message}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
