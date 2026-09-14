import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, ShieldCheck } from 'lucide-react';

const STILL_LIFES = [
  {
    id: 'rojos-mesa-luz',
    title: 'Rojos en Mesa de Luz',
    subtitle: 'Situación nocturna, lectura y desconexión previa al descanso',
    time: '21:30 hs — Noche',
    tag: 'Filtro Noche Rojo (100%)',
    image: '/products/_DSC8682.webp',
    description: 'En tu mesa de luz, listos para la última hora del día. Bloquean el espectro azul/verde de pantallas y luminarias, permitiendo el pico natural de melatonina y facilitando el sueño reparador.',
    accentColor: '#AC1917',
    specs: ['100% Bloqueo Azul', 'Transmitancia 9.53%', 'Norma ISO 12312-1'],
  },
  {
    id: 'transicion-gamer',
    title: 'Transición Gamer / Pantallas Tarde',
    subtitle: 'Situación gaming y trabajo de alta exigencia visual al atardecer',
    time: '18:00 hs — Caída Solar',
    tag: 'Filtro Transición Naranja (95%)',
    image: '/products/_DSC8688.webp',
    description: 'Diseñados para sesiones continuas de monitores durante el final de la tarde. Filtran el 95% de la luz azul en el rango crítico sin alterar la nitidez ni generar fatiga.',
    accentColor: '#E84A0F',
    specs: ['95% Bloqueo Azul', 'Transmitancia 49.93%', 'Cero Resplandor'],
  },
  {
    id: 'amarillos-trabajando',
    title: 'Amarillos Trabajando',
    subtitle: 'Situación diurna de oficina, código y foco sostenido',
    time: '10:00 hs — Jornada Diurna',
    tag: 'Filtro Día Amarillo (84%)',
    image: '/products/_DSC8692.webp',
    description: 'Tu herramienta diaria frente a monitores. Bloquea el 84% de la luz azul preservando la percepción natural del color para trabajar sin cefaleas ni cansancio ocular.',
    accentColor: '#F3B93A',
    specs: ['84% Bloqueo Azul', 'Transmitancia 76.17%', '100% UV400'],
  },
];

export default function StillLifeCarousel() {
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.8;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="still-life" className="py-24 bg-cirqa-negro text-white relative overflow-hidden border-t border-white/10">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cirqa-ocaso/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-cirqa-arena font-semibold block mb-2">
              PASARELA DE FOTOS STILL LIFE
            </span>
            <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
              Situaciones Reales de Uso.
            </h2>
            <p className="text-xs sm:text-sm text-white/60 font-light mt-1">
              (Rojos en mesa de luz · Transición gamer · Amarillos trabajando)
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-cirqa-negro disabled:opacity-30 transition-all shadow-sm"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-cirqa-negro disabled:opacity-30 transition-all shadow-sm"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Snap-x Mandatory Still Life Track with tactile drag, generous hover clearance and zero clipping */}
        <div className="relative -mx-6 px-6 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 mb-16">
          <div
            ref={containerRef}
            onScroll={checkScroll}
            className="flex gap-6 md:gap-8 overflow-x-auto pt-6 pb-12 scroll-px-6 sm:scroll-px-8 lg:scroll-px-12 snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {STILL_LIFES.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="w-[320px] sm:w-[460px] lg:w-[540px] flex-shrink-0 snap-start bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-white/25 flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all duration-300 relative z-10 hover:z-20"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-cirqa-arena text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {item.time}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider text-white border"
                      style={{ borderColor: item.accentColor, backgroundColor: `${item.accentColor}33` }}
                    >
                      {item.tag}
                    </span>
                  </div>

                  {/* Product studio image container on a clean pedestal */}
                  <div className="w-full h-44 sm:h-52 bg-white rounded-2xl p-4 flex items-center justify-center border border-white/15 overflow-hidden relative shadow-inner">
                    {/* Subtle color glow matching the lens */}
                    <div
                      className="absolute w-36 h-36 rounded-full blur-2xl opacity-20 pointer-events-none"
                      style={{ backgroundColor: item.accentColor }}
                    />
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain select-none filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)] relative z-10 p-2"
                      style={{ mixBlendMode: 'multiply' }}
                      loading="lazy"
                    />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-white/50 font-medium">
                    {item.subtitle}
                  </p>

                  <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Graphical Lens Spec Block */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-3 text-xs text-white/70 font-light">
                    {item.specs.map((spec, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-cirqa-arena" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="w-12 h-6 rounded-full border self-end flex items-center justify-center"
                    style={{ borderColor: item.accentColor, backgroundColor: `${item.accentColor}44` }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.accentColor }} />
                  </div>
                </div>
              </motion.div>
            ))}
            {/* Trailing spacer so the last card has comfortable breathing room */}
            <div className="w-2 sm:w-6 flex-shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* ========================================================== */}
        {/* EXACT MANIFIESTO CITA FROM WIREFRAME                       */}
        {/* ========================================================== */}
        <div className="max-w-4xl mx-auto text-left sm:text-center py-10 px-8 bg-gradient-to-r from-cirqa-ocaso/80 via-cirqa-carmin/80 to-cirqa-primario/80 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/80">
            La mayoría de los hogares le dicen a tu cerebro: <span className="text-cirqa-amarillo">SEGUÍ DESPIERTO!</span>
          </p>
          <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-tight leading-tight space-y-1">
            <p>La solución no es la oscuridad absoluta.</p>
            <p className="font-semibold text-cirqa-arena">
              Es la luz correcta.<br className="hidden sm:inline" /> Cálida, ámbar, roja.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
