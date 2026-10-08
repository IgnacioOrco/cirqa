import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Hero({ onExploreModels, onExploreTech, onOpenQuiz }) {
  return (
    <section className="relative min-h-[92vh] pt-28 sm:pt-32 pb-0 flex items-end justify-center bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end min-h-[calc(92vh-7rem)]">
        
        {/* Left Column: Narrative Copy */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          className="lg:col-span-6 flex flex-col justify-center pb-12 lg:pb-20 pt-6 z-10"
        >
          {/* Volanta */}
          <span className="text-[10px] uppercase tracking-[0.2em] text-cirqa-negro/70 font-semibold mb-3 block">
            CLARIDAD EN UN MUNDO LLENO DE RUIDO
          </span>

          {/* H1 Masivo */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-cirqa-negro tracking-tighter leading-[1.1] mb-6">
            PROTEGE TU ENFOQUE
          </h1>

          {/* Paragraph */}
          <p className="text-base sm:text-lg text-cirqa-negro/90 font-light leading-relaxed max-w-lg mb-8">
            El cuerpo entiende de señales, no de buenas intenciones. CIRQA filtra la luz que te desconcentra para que tu ritmo natural haga el resto.
          </p>

          {/* Action Buttons: Apple Pill Style con Acceso Directo al Test Circadiano */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={onExploreModels}
              className="bg-cirqa-primario text-white text-[13px] font-semibold tracking-wider uppercase px-7 py-4 rounded-full hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              Ver modelos
            </button>
            {onOpenQuiz && (
              <button
                onClick={onOpenQuiz}
                className="bg-gradient-to-r from-amber-500/10 to-amber-600/15 border border-amber-500/40 text-amber-900 text-[13px] font-semibold tracking-wider uppercase px-6 py-4 rounded-full hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-2 shadow-xs cursor-pointer group"
                title="Descubrí tu rutina circadiana"
              >
                <Sparkles className="w-4 h-4 text-amber-600 group-hover:rotate-12 transition-transform" />
                <span>Test Circadiano</span>
              </button>
            )}
            <button
              onClick={onExploreTech}
              className="border border-cirqa-negro/30 text-cirqa-negro text-[13px] font-semibold tracking-wider uppercase px-6 py-4 rounded-full hover:border-cirqa-negro hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
            >
              Tecnología
            </button>
          </div>

          {/* Micro status specs */}
          <div className="mt-12 pt-6 border-t border-cirqa-negro/15 flex items-center gap-8 text-[11px] text-cirqa-negro/75 font-normal tracking-wide">
            <div>
              <span className="text-cirqa-negro font-semibold block">0% Distorsión</span>
              Filtro óptico puro
            </div>
            <div>
              <span className="text-cirqa-negro font-semibold block">100% UV400</span>
              Protección certificada
            </div>
            <div>
              <span className="text-cirqa-negro font-semibold block">Certificación ISO</span>
              Norma 12312-1:2022
            </div>
          </div>
        </motion.div>

        {/* Right Column: Model anchored to the bottom-right corner */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 20, delay: 0.15 }}
          className="lg:col-span-6 flex items-end justify-center lg:justify-end relative self-end h-full"
        >
          <div className="relative flex items-end justify-end w-full max-w-lg lg:max-w-xl">
            
            {/* Ambient soft glow behind model */}
            <div className="absolute -bottom-10 right-0 w-80 h-80 bg-cirqa-surface rounded-full blur-3xl -z-10 opacity-70" />

            {/* Model Image placed in bottom-right corner */}
            <picture className="w-full flex items-end justify-center lg:justify-end">
              <source srcSet="/assets/hero-model.webp" type="image/webp" />
              <img
                src="/assets/hero-model.png"
                alt="Modelo luciendo armazón CIRQA con cristales de bienestar circadiano"
                className="max-h-[500px] sm:max-h-[580px] lg:max-h-[660px] w-auto object-contain object-bottom select-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.12)]"
                loading="eager"
              />
            </picture>

            {/* Floating Glassmorphism Spec Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.5 }}
              className="absolute bottom-6 left-4 sm:left-6 bg-white/90 backdrop-blur-xl border border-cirqa-negro/10 px-4 py-2.5 rounded-2xl text-[11px] text-cirqa-negro/85 font-normal tracking-wide shadow-lg"
            >
              <span className="font-semibold text-cirqa-negro">Modelo Q2</span> · Filtro Transición Ámbar
            </motion.div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
