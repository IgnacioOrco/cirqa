import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const MANIFESTO_IMAGES = [
  {
    src: '/assets/MANIFIESTO 1.jpg',
    alt: 'Campaña CIRQA — Bienestar y Sincronización Circadiana',
    title: 'Campaña CIRQA 2026',
    subtitle: 'Enfoque Diurno · Sincronía Nocturna',
    badge: 'Edición Oficial',
  },
  {
    src: '/assets/MANIFIESTO 2.jpg',
    alt: 'Modelo CIRQA — Calibración Espectral y Luz Solar',
    title: 'Biología Visual',
    subtitle: 'Sincronización con el Ciclo Solar Natural',
    badge: 'Laboratorio Óptico',
  },
  {
    src: '/assets/MANIFIESTO 3.jpg',
    alt: 'Filtro Óptico CIRQA — Arquitectura del Descanso',
    title: 'Arquitectura del Descanso',
    subtitle: '99% Bloqueo Luz Azul · Melatonina Natural',
    badge: 'ISO 12312-1',
  },
  {
    src: '/assets/MANIFIESTO 4.jpg',
    alt: 'Filtro Día Amarillo frente a monitores',
    title: 'Foco y Claridad Mental',
    subtitle: '84% Bloqueo Digital sin Distorsión de Color',
    badge: 'TR-90 Ultraliviano',
  },
];

export default function AboutManifesto({ onExploreModels }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Autoplay sutil cada 4.5 segundos
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % MANIFESTO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + MANIFESTO_IMAGES.length) % MANIFESTO_IMAGES.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % MANIFESTO_IMAGES.length);
  };

  const activePhoto = MANIFESTO_IMAGES[currentSlide];

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

        {/* 2-Column Grid: Text Manifesto + Campaign Photography Carousel */}
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
                className="inline-flex items-center gap-2 border border-cirqa-arena text-cirqa-arena hover:bg-cirqa-arena hover:text-cirqa-negro active:scale-95 text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-full transition-all duration-300 shadow-md group cursor-pointer"
              >
                <span>Explorar Colección de Modelos</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: Carrusel Slider de Fotos de Manifiesto */}
          <div 
            className="lg:col-span-6 relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative rounded-3xl overflow-hidden bg-cirqa-darkSurface border border-white/10 shadow-2xl group">
              
              {/* Campaign Image Slider */}
              <div className="aspect-[4/5] w-full relative overflow-hidden bg-gradient-to-b from-[#201610] to-[#120B07] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activePhoto.src}
                    src={encodeURI(activePhoto.src)}
                    alt={activePhoto.alt}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/hero-model.png';
                    }}
                  />
                </AnimatePresence>
                
                {/* Subtle vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-cirqa-negro/85 via-transparent to-transparent pointer-events-none" />

                {/* Controles de avance / retroceso */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="w-9 h-9 rounded-full bg-cirqa-negro/60 hover:bg-cirqa-negro border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg"
                    aria-label="Foto anterior del manifiesto"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-9 h-9 rounded-full bg-cirqa-negro/60 hover:bg-cirqa-negro border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg"
                    aria-label="Foto siguiente del manifiesto"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Indicador de Dots */}
                <div className="absolute top-6 left-6 z-20 flex items-center gap-1.5">
                  {MANIFESTO_IMAGES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        currentSlide === idx
                          ? 'w-6 bg-cirqa-arena'
                          : 'w-2 bg-white/30 hover:bg-white/60'
                      }`}
                      aria-label={`Ver diapositiva ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Editorial Caption Badge */}
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-cirqa-negro/90 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between text-xs font-light shadow-xl z-20">
                  <div>
                    <span className="text-white font-medium block">{activePhoto.title}</span>
                    <span className="text-white/60 text-[11px]">{activePhoto.subtitle}</span>
                  </div>
                  <span className="text-cirqa-arena text-[10px] uppercase tracking-widest font-semibold border border-cirqa-arena/30 px-3 py-1 rounded-full">
                    {activePhoto.badge}
                  </span>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
