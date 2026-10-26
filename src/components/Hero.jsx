import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HERO_SLIDES = [
  {
    id: 'hero-slide-1',
    image: '/assets/home-slider-1a.webp',
    imageMobile: '/assets/home-slider-1a-mobile.webp',
    fallback: '/assets/HOME%20SLIDER%201A.jpg',
    alt: 'Campaña CIRQA 2026 — Modelo con cristales circadianos',
    badge: 'Campaña Oficial CIRQA 2026',
    subtitle: 'Claridad en un mundo lleno de ruido',
  },
  {
    id: 'hero-slide-2',
    image: '/assets/home-slider-1b.webp',
    imageMobile: '/assets/home-slider-1b-mobile.webp',
    fallback: '/assets/HOME%20SLIDER%201B.jpg',
    alt: 'Modelo CIRQA — Foco y protección visual diurna',
    badge: 'Modelo Q 001 · Filtro Día Amarillo',
    subtitle: 'Foco sostenido sin fatiga digital',
  },
  {
    id: 'hero-slide-3',
    image: '/assets/home-slider-1c.webp',
    imageMobile: '/assets/home-slider-1c-mobile.webp',
    fallback: '/assets/HOME%20SLIDER%201C.jpg',
    alt: 'Modelo CIRQA — Sincronía y bienestar circadiano',
    badge: 'Modelo Q 002 · Transición & Noche',
    subtitle: 'Restauración del ritmo biológico',
  },
];

export default function Hero({ onExploreModels, onExploreTech, onOpenQuiz, onOpenTrials }) {
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
    <section className="relative min-h-[92vh] pt-32 sm:pt-36 pb-8 sm:pb-12 flex items-center justify-center bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch min-h-[calc(92vh-7rem)]">
        
        {/* Left Column: Narrative Copy - Renderizado estático sin bloqueo JS (LCP instantáneo) */}
        <div className="lg:col-span-6 flex flex-col justify-center pb-8 lg:pb-12 pt-4 z-10">
          {/* Volanta */}
          <span className="text-[10px] uppercase tracking-[0.2em] text-cirqa-negro/70 font-semibold mb-3 block">
            CLARIDAD EN UN MUNDO LLENO DE RUIDO
          </span>

          {/* H1 Masivo */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-cirqa-negro tracking-tighter leading-[1.1] mb-6">
            PROTEGE TU ENFOQUE
          </h1>

          {/* Paragraph (Elemento LCP Crítico - Sin retraso de renderizado) */}
          <p className="text-base sm:text-lg text-cirqa-negro/90 font-light leading-relaxed max-w-lg mb-8">
            El cuerpo entiende de señales, no de buenas intenciones. CIRQA filtra la luz que te desconcentra para que tu ritmo natural haga el resto.
          </p>

          {/* Action Buttons: Apple Pill Style con Acceso Directo al Catálogo, Test Circadiano y Situaciones de Uso */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              to="/catalogo"
              className="bg-cirqa-primario text-white text-[13px] font-semibold tracking-wider uppercase px-7 py-4 rounded-full hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer inline-flex items-center justify-center"
            >
              Ver catálogo
            </Link>
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
            <div
              onClick={() => {
                if (onOpenTrials) {
                  onOpenTrials('dia');
                } else {
                  window.open('/certificates/CIRQA-Certificado-Filtro-Dia.pdf', '_blank');
                }
              }}
              className="cursor-pointer group select-none"
              title="Ver reportes y certificados oficiales de laboratorio"
            >
              <span className="text-cirqa-negro font-semibold block group-hover:text-cirqa-primario transition-colors">
                Certificación ISO
              </span>
              Norma 12312-1:2022
            </div>
          </div>
        </div>

        {/* Right Column: Carrusel Slider de Campaña */}
        <div 
          className="lg:col-span-6 relative w-full h-full min-h-[520px] md:min-h-[620px] lg:min-h-[720px] flex items-stretch py-2"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Ambient soft glow behind slider */}
          <div className="absolute -bottom-10 right-0 w-80 h-80 bg-cirqa-surface rounded-full blur-3xl -z-10 opacity-70" />

          {/* Slider Image Container con aprovechamiento vertical total y calidad editorial */}
          <div className="relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-[#111111]">
            {HERO_SLIDES.map((slide, idx) => (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-out ${
                  currentSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <picture className="w-full h-full block">
                  <source media="(max-width: 768px)" srcSet={slide.imageMobile} type="image/webp" />
                  <source srcSet={slide.image} type="image/webp" />
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    width="750"
                    height="1125"
                    fetchPriority={idx === 0 ? 'high' : 'auto'}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding={idx === 0 ? 'sync' : 'async'}
                    className="w-full h-full object-cover object-top md:object-center select-none"
                    onError={(e) => {
                      if (slide.fallback) {
                        e.currentTarget.src = slide.fallback;
                      }
                    }}
                  />
                </picture>
              </div>
            ))}

            {/* Botones de Navegación del Slider con área táctil accesible min 44x44px */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full backdrop-blur-md bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center text-white transition-colors shadow-md cursor-pointer"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full backdrop-blur-md bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center text-white transition-colors shadow-md cursor-pointer"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Dots Indicadores con área táctil accesible min 44x44px */}
            <div className="absolute top-4 left-4 z-20 flex items-center">
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer group"
                  aria-label={`Ir al slide ${idx + 1}`}
                >
                  <span
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentSlide === idx
                        ? 'w-7 bg-white shadow-sm'
                        : 'w-2.5 bg-white/40 group-hover:bg-white/70'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Floating Glassmorphism Spec Badge */}
            <div 
              className="absolute bottom-6 left-5 sm:left-6 right-5 sm:right-auto backdrop-blur-md bg-black/40 border border-white/20 px-4 py-2.5 rounded-2xl text-[11px] text-white font-normal tracking-wide shadow-xl z-20 transition-all duration-300"
            >
              <span className="font-semibold text-white block">{activeSlide.badge}</span>
              <span className="text-[10px] text-white/75">{activeSlide.subtitle}</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
