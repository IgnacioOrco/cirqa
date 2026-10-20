import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function FilterDetailsCampaign({ onOpenTrials, onThemeChange }) {
  const containerRef = useRef(null);

  // Track scroll progress along the 240vh container for continuous transition
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Inertial spring physics for Apple-grade silky smooth scroll transitions
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 26,
    mass: 0.2,
    restDelta: 0.0001,
  });

  // Ensure navbar stays in light theme since section background is unified clean white
  useEffect(() => {
    if (onThemeChange) {
      onThemeChange(false);
    }
  }, [onThemeChange]);

  // --- STAGE 1: Filtro Amarillo (84%) ---
  const lens1X = useTransform(smoothProgress, [0.0, 0.12, 0.26, 0.36], ['100%', '0%', '0%', '-100%']);
  const lens1Opacity = useTransform(smoothProgress, [0.0, 0.10, 0.26, 0.34], [0, 1, 1, 0]);
  const lens1Scale = useTransform(smoothProgress, [0.0, 0.12, 0.26, 0.36], [0.95, 1, 1, 0.96]);

  const text1Y = useTransform(smoothProgress, [0.02, 0.13, 0.25, 0.34], [25, 0, 0, -25]);
  const text1Opacity = useTransform(smoothProgress, [0.02, 0.12, 0.25, 0.32], [0, 1, 1, 0]);

  // --- STAGE 2: Filtro Naranja (95%) ---
  const lens2X = useTransform(smoothProgress, [0.32, 0.44, 0.58, 0.68], ['-100%', '0%', '0%', '100%']);
  const lens2Opacity = useTransform(smoothProgress, [0.32, 0.42, 0.58, 0.66], [0, 1, 1, 0]);
  const lens2Scale = useTransform(smoothProgress, [0.32, 0.44, 0.58, 0.68], [0.95, 1, 1, 0.96]);

  const text2Y = useTransform(smoothProgress, [0.34, 0.45, 0.57, 0.66], [25, 0, 0, -25]);
  const text2Opacity = useTransform(smoothProgress, [0.34, 0.44, 0.57, 0.64], [0, 1, 1, 0]);

  // --- STAGE 3: Filtro Rojo (100%) ---
  const lens3X = useTransform(smoothProgress, [0.64, 0.78, 1.0], ['100%', '0%', '0%']);
  const lens3Opacity = useTransform(smoothProgress, [0.64, 0.76, 1.0], [0, 1, 1]);
  const lens3Scale = useTransform(smoothProgress, [0.64, 0.78, 1.0], [0.95, 1, 1]);

  const text3Y = useTransform(smoothProgress, [0.66, 0.79, 1.0], [25, 0, 0]);
  const text3Opacity = useTransform(smoothProgress, [0.66, 0.78, 1.0], [0, 1, 1]);

  return (
    <section id="tecnologia" className="relative bg-white">
      
      {/* Top Ticker Marquee Bar */}
      <div className="w-full bg-cirqa-surface border-y border-cirqa-negro/10 py-3 overflow-hidden z-20 relative">
        <div className="flex whitespace-nowrap animate-marquee text-[11px] sm:text-xs font-semibold tracking-[0.2em] text-cirqa-negro uppercase">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="mx-6">
              FILTRO UV400 · ANTIREFLEX · FILTRO DE LUZ AZUL PARA USO DIGITAL ·
            </span>
          ))}
        </div>
      </div>

      {/* Scroll-Jacking Narrative Container */}
      <div ref={containerRef} className="relative h-[240vh] bg-white">
        
        {/* Sticky Fullscreen Presentation Stage (Unified clean white background) */}
        <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden px-6 bg-white">
          {/* Header Track */}
          <div className="absolute top-20 sm:top-24 left-0 right-0 max-w-7xl mx-auto px-6 sm:px-8 flex justify-between items-start pointer-events-none z-10">
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold block text-[#7A6A5E]">
                Detalle de Filtros · Tecnología Óptica
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight mt-1 text-[#18110B]">
                Tres Niveles de Calibración Espectral.
              </h2>
            </div>
          </div>

          {/* Central Presentation Canvas */}
          <div className="relative w-full max-w-6xl mx-auto h-[500px] flex items-center justify-center">
            
            {/* ========================================================= */}
            {/* FASE 1: FILTRO AMARILLO (84%)                             */}
            {/* ========================================================= */}
            <motion.div
              style={{ opacity: lens1Opacity }}
              className="absolute inset-0 w-full h-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 pointer-events-none"
            >
              {/* Narrative Text */}
              <motion.div
                style={{ opacity: text1Opacity, y: text1Y }}
                className="w-full md:w-5/12 flex flex-col justify-center text-left pointer-events-auto text-cirqa-negro"
              >
                <div className="text-[10px] md:text-[11px] font-semibold tracking-[0.2em] uppercase text-[#B86B00] mb-2">
                  06:00 — 17:00 · MAÑANA & DÍA
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#18110B] tracking-tight mb-3">
                  FILTRO AMARILLO (84%)
                </h3>
                <p className="text-xs sm:text-sm font-normal text-[#382B21] leading-relaxed mb-6 max-w-md">
                  diseñado para quienes necesitan una protección confiable frente a las pantallas durante todo el día. Con lentes que bloquean el 84% de la luz azul dañina mientras preservan la percepción natural del color, defendiendo tus ojos sin compromisos en la era digital.
                </p>
                <div>
                  <button
                    onClick={() => (onOpenTrials ? onOpenTrials('dia') : window.open('/certificates/CIRQA-Certificado-Filtro-Dia.pdf', '_blank'))}
                    className="inline-flex items-center gap-2 bg-cirqa-primario hover:brightness-110 active:scale-95 text-white text-[11px] font-bold tracking-widest uppercase px-7 py-4 rounded-full transition-all shadow-md group cursor-pointer"
                  >
                    <span>ACCEDE AL ESTUDIO</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>

              {/* Lens Render Image */}
              <motion.div
                style={{ x: lens1X, scale: lens1Scale }}
                className="w-full md:w-7/12 flex items-center justify-center md:justify-end"
              >
                <div className="w-full max-w-md sm:max-w-lg relative">
                  <img
                    src="/assets/lens-dia.webp"
                    alt="CIRQA con Filtro Amarillo 84%"
                    width="1024"
                    height="634"
                    className="w-full h-auto object-contain select-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)] mix-blend-multiply"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (e.currentTarget.src.endsWith('.webp')) {
                        e.currentTarget.src = '/assets/lens-dia.png';
                      }
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* ========================================================= */}
            {/* FASE 2: FILTRO NARANJA (95%)                              */}
            {/* ========================================================= */}
            <motion.div
              style={{ opacity: lens2Opacity }}
              className="absolute inset-0 w-full h-full flex flex-col md:flex-row-reverse items-center justify-between gap-8 md:gap-12 pointer-events-none"
            >
              {/* Narrative Text */}
              <motion.div
                style={{ opacity: text2Opacity, y: text2Y }}
                className="w-full md:w-5/12 flex flex-col justify-center text-left md:text-right pointer-events-auto text-cirqa-negro"
              >
                <div className="text-[10px] md:text-[11px] font-semibold tracking-[0.2em] uppercase text-[#D95A1E] mb-2">
                  17:00 — 20:00 · TARDE & TRANSICIÓN
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#18110B] tracking-tight mb-3">
                  FILTRO NARANJA (95%)
                </h3>
                <p className="text-xs sm:text-sm font-normal text-[#382B21] leading-relaxed mb-6 max-w-md md:ml-auto">
                  logra el equilibrio perfecto para el uso de pantallas durante el día. Las lentes naranjas filtran más del 95% de la luz azul en el rango crítico de alta energía, reduciendo la fatiga ocular mientras mantienen una vista brillante y vívida.
                  <br className="my-2 block" />
                  mantiene tu enfoque nítido y tus ojos relajados desde la primera luz hasta el último correo electrónico.
                </p>
                <div className="flex md:justify-end">
                  <button
                    onClick={() => (onOpenTrials ? onOpenTrials('transicion') : window.open('/certificates/CIRQA-Certificado-Filtro-Transicion.pdf', '_blank'))}
                    className="inline-flex items-center gap-2 bg-cirqa-primario hover:brightness-110 active:scale-95 text-white text-[11px] font-bold tracking-widest uppercase px-7 py-4 rounded-full transition-all shadow-md group cursor-pointer"
                  >
                    <span>ACCEDE AL ESTUDIO</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>

              {/* Lens Render Image */}
              <motion.div
                style={{ x: lens2X, scale: lens2Scale }}
                className="w-full md:w-7/12 flex items-center justify-center md:justify-start"
              >
                <div className="w-full max-w-md sm:max-w-lg relative">
                  <img
                    src="/assets/lens-transicion.webp"
                    alt="CIRQA con Filtro Naranja 95%"
                    width="1024"
                    height="634"
                    className="w-full h-auto object-contain select-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)] mix-blend-multiply"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (e.currentTarget.src.endsWith('.webp')) {
                        e.currentTarget.src = '/assets/lens-transicion.png';
                      }
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* ========================================================= */}
            {/* FASE 3: FILTRO ROJO (100%)                                */}
            {/* ========================================================= */}
            <motion.div
              style={{ opacity: lens3Opacity }}
              className="absolute inset-0 w-full h-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 pointer-events-none"
            >
              {/* Narrative Text */}
              <motion.div
                style={{ opacity: text3Opacity, y: text3Y }}
                className="w-full md:w-5/12 flex flex-col justify-center text-left pointer-events-auto text-cirqa-negro"
              >
                <div className="text-[10px] md:text-[11px] font-semibold tracking-[0.2em] uppercase text-[#AC1917] mb-2">
                  20:00 — 06:00 · NOCHE & MELATONINA
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#18110B] tracking-tight mb-3">
                  FILTRO ROJO (100%)
                </h3>
                <p className="text-xs sm:text-sm font-normal text-[#382B21] leading-relaxed mb-6 max-w-md">
                  este modelo está diseñado para un enfoque profundo y claridad nocturna. Sus lentes rojos bloquean casi el 100% de la luz azul, creando un campo visual tranquilo ideal para uso nocturno.
                  <br className="my-2 block" />
                  Ya sea que estés diseñando, leyendo o relajándote después del anochecer.
                  <br className="my-2 block" />
                  protege tu mente y visión del esfuerzo digital sin distracciones, sin compromisos.
                </p>
                <div>
                  <button
                    onClick={() => (onOpenTrials ? onOpenTrials('noche') : window.open('/certificates/CIRQA-Certificado-Filtro-Noche.pdf', '_blank'))}
                    className="inline-flex items-center gap-2 bg-cirqa-primario hover:brightness-110 active:scale-95 text-white text-[11px] font-bold tracking-widest uppercase px-7 py-4 rounded-full transition-all shadow-md group cursor-pointer"
                  >
                    <span>ACCEDE AL ESTUDIO</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>

              {/* Lens Render Image */}
              <motion.div
                style={{ x: lens3X, scale: lens3Scale }}
                className="w-full md:w-7/12 flex items-center justify-center md:justify-end"
              >
                <div className="w-full max-w-md sm:max-w-lg relative">
                  <img
                    src="/assets/lens-noche.webp"
                    alt="CIRQA con Filtro Rojo 100%"
                    width="1024"
                    height="634"
                    className="w-full h-auto object-contain select-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)] mix-blend-multiply"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (e.currentTarget.src.endsWith('.webp')) {
                        e.currentTarget.src = '/assets/lens-noche.png';
                      }
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>

          </div>

        </div>
      </div>

    </section>
  );
}
