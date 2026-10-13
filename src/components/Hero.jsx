import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const HERO_SLIDES = [
  {
    id: 'hero-slide-1',
    image: '/assets/HOME SLIDER 1A.jpg',
    fallback: '/assets/hero-model.webp',
    alt: 'Campaña CIRQA 2026 — Modelo con cristales circadianos',
    badge: 'Campaña Oficial CIRQA 2026',
    subtitle: 'Claridad en un mundo lleno de ruido',
  },
  {
    id: 'hero-slide-2',
    image: '/assets/HOME SLIDER 1B.jpg',
    fallback: '/assets/modelo.png',
    alt: 'Modelo CIRQA — Foco y protección visual diurna',
    badge: 'Modelo Q 001 · Filtro Día Amarillo',
    subtitle: 'Foco sostenido sin fatiga digital',
  },
  {
    id: 'hero-slide-3',
    image: '/assets/HOME SLIDER 1C.jpg',
    fallback: '/products/_DSC8660.webp',
    alt: 'Modelo CIRQA — Sincronía y bienestar circadiano',
    badge: 'Modelo Q 002 · Transición & Noche',
    subtitle: 'Restauración del ritmo biológico',
  },
];

export default function Hero({ onExploreModels, onExploreTech, onOpenQuiz }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Autoplay suave cada 5 segundos
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleScrollToSituacionesTech = () => {
    const el =
      document.getElementById('situaciones') ||
      document.getElementById('still-life') ||
      document.getElementById('tecnologia') ||
      document.getElementById('ritmo-circadiano');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onExploreTech) {
      onExploreTech();
    }
  };

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative min-h-[92vh] pt-32 sm:pt-36 pb-0 flex items-end justify-center bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end min-h-[calc(92vh-7rem)]">
        
        {/* Left Column: Narrative Copy */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          className="lg:col-span-6 flex flex-col justify-center pb-12 lg:pb-20 pt-4 z-10"
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

          {/* Action Buttons: Apple Pill Style con Acceso Directo al Test Circadiano y Situaciones de Uso */}
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
              onClick={handleScrollToSituacionesTech}
              className="border border-cirqa-negro/30 text-cirqa-negro text-[13px] font-semibold tracking-wider uppercase px-6 py-4 rounded-full hover:border-cirqa-negro hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
            >
              Situaciones de Uso / Tecnología
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

        {/* Right Column: Carrusel Slider de Campaña */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 20, delay: 0.15 }}
          className="lg:col-span-6 flex items-end justify-center lg:justify-end relative self-end h-full"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative flex items-end justify-center lg:justify-end w-full max-w-lg lg:max-w-xl pb-2">
            
            {/* Ambient soft glow behind slider */}
            <div className="absolute -bottom-10 right-0 w-80 h-80 bg-cirqa-surface rounded-full blur-3xl -z-10 opacity-70" />

            {/* Slider Image Container con Crossfade Elegante */}
            <div className="w-full h-[480px] sm:h-[560px] lg:h-[640px] relative flex items-end justify-center lg:justify-end overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="w-full h-full flex items-end justify-center lg:justify-end"
                >
                  <picture className="w-full h-full flex items-end justify-center lg:justify-end">
                    <source srcSet={activeSlide.image} type="image/webp" />
                    <img
                      src={activeSlide.fallback || activeSlide.image}
                      alt={activeSlide.alt}
                      className="max-h-[460px] sm:max-h-[540px] lg:max-h-[620px] w-auto object-contain object-bottom select-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.12)]"
                      loading="eager"
                    />
                  </picture>
                </motion.div>
              </AnimatePresence>

              {/* Botones de Navegación del Slider */}
              <div className="absolute top-8 right-4 z-20 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-cirqa-negro/15 flex items-center justify-center text-cirqa-negro/70 hover:text-cirqa-negro transition-all shadow-xs cursor-pointer backdrop-blur-xs"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-cirqa-negro/15 flex items-center justify-center text-cirqa-negro/70 hover:text-cirqa-negro transition-all shadow-xs cursor-pointer backdrop-blur-xs"
                  aria-label="Foto siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Dots Indicadores */}
              <div className="absolute top-10 left-4 z-20 flex items-center gap-1.5">
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      currentSlide === idx
                        ? 'w-6 bg-cirqa-primario'
                        : 'w-2 bg-cirqa-negro/20 hover:bg-cirqa-negro/40'
                    }`}
                    aria-label={`Ir al slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Floating Glassmorphism Spec Badge */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeSlide.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-6 left-4 sm:left-6 bg-white/95 backdrop-blur-xl border border-cirqa-negro/10 px-4 py-2.5 rounded-2xl text-[11px] text-cirqa-negro/85 font-normal tracking-wide shadow-lg z-20"
                >
                  <span className="font-semibold text-cirqa-negro block">{activeSlide.badge}</span>
                  <span className="text-[10px] text-cirqa-negro/60">{activeSlide.subtitle}</span>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
