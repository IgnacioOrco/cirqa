import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AboutManifesto({ onExploreModels }) {
  return (
    <section id="nosotros" className="py-28 bg-cirqa-negro text-white relative overflow-hidden">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cirqa-ocaso/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-cirqa-arena/5 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Volanta & Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="text-[11px] uppercase tracking-widest text-cirqa-arena font-semibold block mb-3">
            Nosotros · Manifiesto CIRQA
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight leading-tight">
            “No vendemos lentes.<br />
            <span className="font-medium text-cirqa-arena">Diseñamos condiciones para vivir mejor.</span>”
          </h2>
        </motion.div>

        {/* 2-Column Grid: Text Manifesto + Campaign Photography */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Descriptive Text Manifesto */}
          <div className="lg:col-span-6 space-y-6 text-white/80 font-light leading-relaxed text-sm sm:text-base">
            <p className="text-base sm:text-lg text-white font-light leading-relaxed border-l-2 border-cirqa-arena pl-4">
              El cuerpo entiende de señales. No entiende de buenas intenciones. Responde a la luz que ve, al ritmo al que vive y a lo que se repite cada día.
            </p>

            <p>
              En un entorno hiperconectado, nuestros ojos reciben una sobrecarga lumínica que distorsiona el reloj biológico central. CIRQA nace para restaurar esa sincronía natural entre el ser humano y el ciclo solar.
            </p>

            <p>
              Desarrollamos filtros ópticos calibrados con precisión de laboratorio que bloquean de forma selectiva las longitudes de onda nocivas según el momento de tu jornada. No es solo protección visual: es recuperación celular, claridad mental y descanso profundo.
            </p>

            {/* Three Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-cirqa-arena text-xs font-semibold uppercase tracking-wider">
                  <Sun className="w-3.5 h-3.5" />
                  <span>Día & Foco</span>
                </div>
                <p className="text-[11px] text-white/60 font-light">
                  84% de bloqueo de fatiga digital sin distorsión de color.
                </p>
              </div>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-cirqa-arena text-xs font-semibold uppercase tracking-wider">
                  <Moon className="w-3.5 h-3.5" />
                  <span>Noche & Ritmo</span>
                </div>
                <p className="text-[11px] text-white/60 font-light">
                  99% de bloqueo para inducir melatonina de forma natural.
                </p>
              </div>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-cirqa-arena text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Laboratorio</span>
                </div>
                <p className="text-[11px] text-white/60 font-light">
                  Normas internacionales ISO 12312-1 y ANSI Z80.3.
                </p>
              </div>
            </div>

            {/* CTA Button: Apple Pill Style */}
            <div className="pt-4">
              <button
                onClick={onExploreModels}
                className="inline-flex items-center gap-2 border border-cirqa-arena text-cirqa-arena hover:bg-cirqa-arena hover:text-cirqa-negro active:scale-95 text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-full transition-all duration-300 shadow-md group"
              >
                <span>Explorar Colección de Modelos</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: Campaign Photography */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden bg-cirqa-darkSurface border border-white/10 shadow-2xl group">
              
              {/* Campaign Image */}
              <div className="aspect-[4/5] w-full relative overflow-hidden bg-gradient-to-b from-[#201610] to-[#120B07] flex items-center justify-center">
                <img
                  src="/assets/modelo.png"
                  alt="Campaña CIRQA — Bienestar y Sincronización Circadiana"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
                  onError={(e) => {
                    // Fallback to hero-model if modelo.png has issues
                    e.currentTarget.src = '/assets/hero-model.png';
                  }}
                />
                
                {/* Subtle vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-cirqa-negro/80 via-transparent to-transparent" />
              </div>

              {/* Editorial Caption Badge */}
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-cirqa-negro/85 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between text-xs font-light shadow-xl">
                <div>
                  <span className="text-white font-medium block">Campaña CIRQA 2026</span>
                  <span className="text-white/60 text-[11px]">Enfoque Diurno · Sincronía Nocturna</span>
                </div>
                <span className="text-cirqa-arena text-[10px] uppercase tracking-widest font-semibold border border-cirqa-arena/30 px-3 py-1 rounded-full">
                  Edición Limitada
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
