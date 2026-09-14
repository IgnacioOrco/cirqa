import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Shield,
  Heart,
  Activity,
  Brain,
  Dumbbell,
  Hourglass,
  Moon,
  Sun,
  BedDouble,
  Sparkles,
  ChevronRight,
  Plus,
  X,
  Clock,
  Compass,
} from 'lucide-react';

const PILLARS = [
  {
    id: 'metabolismo',
    name: 'METABOLISMO',
    icon: Flame,
    desc: 'Regulación del balance energético y sensibilidad a la insulina.',
    scientificDetail:
      'La sincronización de los fotorreceptores ipRGC con la luz natural modula la sensibilidad periférica a la insulina y el gasto metabólico basal. La exposición errática a la luz azul nocturna interrumpe la termogénesis adiposa y desregula el balance glucémico. Lorem ipsum dolor sit amet, photobiological circadian entrainment optimizes mitochondrial ATP efficiency and metabolic homeostasis.',
    highlight: 'Sensibilidad a la insulina',
  },
  {
    id: 'sistema-inmune',
    name: 'SISTEMA INMUNE',
    icon: Shield,
    desc: 'Modulación de defensas y citoquinas inflamatorias nocturnas.',
    scientificDetail:
      'Durante las fases de oscuridad total y pico de melatonina, el sistema inmunitario orquesta la redistribución de linfocitos T y modula la cascada de citoquinas proinflamatorias (IL-6, TNF-alfa). La mitigación de la luz azul en la noche preserva esta respuesta citotóxica natural. Lorem ipsum immune modulation through dark phase recovery.',
    highlight: 'Modulación de defensas',
  },
  {
    id: 'salud-mental',
    name: 'SALUD MENTAL',
    icon: Heart,
    desc: 'Estabilidad anímica y resistencia al estrés cotidiano.',
    scientificDetail:
      'El eje retina-núcleo supraquiasmático regula la síntesis de serotonina diurna y dopamina. Mantener un contraste circadiano óptimo entre el día luminoso y la noche cálida estabiliza la variabilidad anímica y previene el agotamiento neurocognitivo. Lorem ipsum psychological resilience and circadian neurotransmitter balance.',
    highlight: 'Estabilidad anímica',
  },
  {
    id: 'funcion-hormonal',
    name: 'FUNCIÓN HORMONAL',
    icon: Activity,
    desc: 'Picos de cortisol diurno y control de leptina/grelina.',
    scientificDetail:
      'La luz matutina precisa estimula la curva de respuesta del cortisol (CAR), mientras que el bloqueo del espectro 450-480nm al anochecer previene la supresión de melatonina y equilibra las hormonas de saciedad y apetito (leptina y grelina). Lorem ipsum neuroendocrine alignment.',
    highlight: 'Cortisol & Melatonina',
  },
  {
    id: 'rendimiento-cognitivo',
    name: 'RENDIMIENTO COGNITIVO',
    icon: Brain,
    desc: 'Capacidad de concentración, foco y agudeza mental.',
    scientificDetail:
      'La reducción del deslumbramiento digital y la optimización espectral diurna mejoran la velocidad de procesamiento prefrontal, disminuyendo el tiempo de reacción y la fatiga visual subjetiva tras horas de pantalla. Lorem ipsum cognitive focus, visual acuity, and neural processing enhancement.',
    highlight: 'Foco y velocidad neural',
  },
  {
    id: 'recuperacion-muscular',
    name: 'RECUPERACIÓN MUSCULAR',
    icon: Dumbbell,
    desc: 'Secreción de hormona de crecimiento durante el sueño.',
    scientificDetail:
      'El sueño de ondas lentas (NREM etapa 3/4), facilitado por una noche biológicamente oscura, es el desencadenante exclusivo de los pulsos de la hormona somatotrópica (HGH), esencial para la síntesis proteica miofibrilar y la reparación de tejidos. Lorem ipsum myofibrillar repair and anabolic hormonal peaks.',
    highlight: 'Pulsos de HGH y síntesis proteica',
  },
  {
    id: 'longevidad-celular',
    name: 'LONGEVIDAD CELULAR',
    icon: Hourglass,
    desc: 'Procesos de autofagia y mitigación del daño oxidativo.',
    scientificDetail:
      'La melatonina actúa como el antioxidante mitocondrial más potente del organismo, neutralizando radicales libres intramitocondriales y activando genes SIRT1 de longevidad celular y autofagia nocturna. Lorem ipsum mitochondrial biogenesis and cellular autophagy promotion.',
    highlight: 'Autofagia y antioxidación',
  },
  {
    id: 'sueno-reparador',
    name: 'SUEÑO REPARADOR',
    icon: BedDouble,
    desc: 'Fases REM profundas sin interferencia lumínica artificial.',
    scientificDetail:
      'Bloquear las longitudes de onda supresoras 2 a 3 horas antes de dormir adelanta el inicio del sueño en hasta 45 minutos y amplía la densidad de fases REM profundas para la consolidación de la memoria. Lorem ipsum architecture of restorative sleep and architecture preservation.',
    highlight: 'Arquitectura del sueño REM',
  },
];

const PRESETS = [
  { hour: 7, label: '07:00 Despertar', tag: 'Día', sub: 'Pico Cortisol' },
  { hour: 13, label: '13:00 Foco Solar', tag: 'Día', sub: 'Máxima Alerta' },
  { hour: 18.5, label: '18:30 Caída Solar', tag: 'Transición', sub: 'Descenso Azul' },
  { hour: 22, label: '22:00 Noche', tag: 'Noche', sub: 'Pico Melatonina' },
  { hour: 3, label: '03:00 Regeneración', tag: 'Noche', sub: 'Autofagia Celular' },
];

export default function CircadianInfographic() {
  // Current hour on the 24h clock (0 to 24)
  const [currentHour, setCurrentHour] = useState(13); // Default 13:00 (Día)
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const dialRef = useRef(null);

  // Determine biological phase based on hour
  // Day: 06:00 to 18:00
  // Transition / Sunset: 18:00 to 20:00
  // Night: 20:00 to 06:00
  const isDay = currentHour >= 6 && currentHour < 18;
  const isTransition = currentHour >= 18 && currentHour < 20;
  const isNight = currentHour >= 20 || currentHour < 6;

  // Format hour for display (e.g. "13:30 hs" or "07:00 hs")
  const formatHourString = (val) => {
    const hours = Math.floor(val);
    const minutes = Math.round((val - hours) * 60);
    const hStr = hours < 10 ? `0${hours}` : `${hours}`;
    const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hStr}:${mStr}`;
  };

  // Convert angle (0-360) to 24-hour value
  const handleDialPointer = (clientX, clientY) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let angleRad = Math.atan2(dy, dx) + Math.PI / 2; // top is 0 rad
    if (angleRad < 0) angleRad += 2 * Math.PI;

    // Map 0 to 2*PI -> 0 to 24 hours (Top = 12:00 -> 0 rad = 12h)
    let hours = (angleRad / (2 * Math.PI)) * 24;
    // Shift so top (0 rad) = 12:00, right (6h) = 18:00, bottom (12h) = 00:00, left (18h) = 06:00
    hours = (hours + 12) % 24;

    setCurrentHour(Math.round(hours * 10) / 10);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleDialPointer(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      setIsDragging(true);
      handleDialPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        handleDialPointer(e.clientX, e.clientY);
      }
    };
    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };
    const handleTouchMove = (e) => {
      if (isDragging && e.touches && e.touches[0]) {
        handleDialPointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // State for responsive dial radius
  const [dialRadius, setDialRadius] = useState(104);

  useEffect(() => {
    const updateRadius = () => {
      if (dialRef.current) {
        setDialRadius(dialRef.current.clientWidth * 0.36);
      }
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  // Calculate indicator position on the 24h dial
  const angleDeg = ((currentHour - 12 + 24) % 24) * (360 / 24);
  const angleRad = (angleDeg - 90) * (Math.PI / 180);
  const indicatorX = Math.cos(angleRad) * dialRadius;
  const indicatorY = Math.sin(angleRad) * dialRadius;

  return (
    <section id="ritmo-circadiano" className="py-28 bg-cirqa-negro text-white relative overflow-hidden">
      
      {/* Ambient background dynamic mood lighting with smooth transition */}
      <motion.div
        animate={{
          backgroundColor: isDay
            ? 'rgba(243, 185, 58, 0.14)'
            : isTransition
            ? 'rgba(232, 74, 15, 0.16)'
            : 'rgba(172, 25, 23, 0.18)',
          scale: isDay ? 1.05 : 1,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="absolute top-10 right-1/4 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none"
      />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cirqa-arena/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-cirqa-arena block mb-3">
            LA LUZ ES LA SEÑAL QUE GUÍA TU BIOLOGÍA
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight">
            QUÉ ES EL RITMO CIRCADIANO
          </h2>
          <p className="text-xs sm:text-sm text-white/60 font-light mt-3 max-w-xl mx-auto">
            Interactuá con el dial de 24 horas para descubrir cómo la luz y la oscuridad modulan tu química hormonal a lo largo del día.
          </p>
        </motion.div>

        {/* ========================================================== */}
        {/* 1. DIAL CIRCULAR INTERACTIVO DE 24 HORAS                   */}
        {/* ========================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className={`max-w-5xl mx-auto backdrop-blur-2xl rounded-3xl p-6 sm:p-10 lg:p-12 border transition-all duration-700 mb-20 shadow-2xl ${
            isDay
              ? 'bg-white/[0.06] border-cirqa-amarillo/30 shadow-[0_20px_60px_rgba(243,185,58,0.1)]'
              : isTransition
              ? 'bg-white/[0.05] border-cirqa-primario/30 shadow-[0_20px_60px_rgba(232,74,15,0.12)]'
              : 'bg-black/60 border-cirqa-carmin/30 shadow-[0_20px_60px_rgba(172,25,23,0.15)]'
          }`}
        >
          {/* Quick Presets Bar */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-8">
            <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mr-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Momentos clave:
            </span>
            {PRESETS.map((preset) => {
              const isSelected = Math.abs(currentHour - preset.hour) < 1;
              return (
                <button
                  key={preset.hour}
                  onClick={() => setCurrentHour(preset.hour)}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    isSelected
                      ? preset.tag === 'Día'
                        ? 'bg-cirqa-amarillo text-cirqa-negro font-semibold ring-2 ring-cirqa-amarillo/40'
                        : preset.tag === 'Transición'
                        ? 'bg-cirqa-primario text-white font-semibold ring-2 ring-cirqa-primario/40'
                        : 'bg-cirqa-carmin text-white font-semibold ring-2 ring-cirqa-carmin/40'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 font-light'
                  }`}
                >
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* 2-Column Responsive Layout: Interactive Ring + Dynamic Biological State */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left: 24-Hour Circular Interactive Ring */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center select-none">
                
                {/* Outer Glow Halo based on state */}
                <motion.div
                  animate={{
                    boxShadow: isDay
                      ? '0 0 50px rgba(243, 185, 58, 0.35)'
                      : isTransition
                      ? '0 0 50px rgba(232, 74, 15, 0.35)'
                      : '0 0 55px rgba(172, 25, 23, 0.4)',
                  }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  className="rounded-full"
                >
                  {/* The interactive dial track container */}
                  <div
                    ref={dialRef}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full cursor-grab active:cursor-grabbing p-4 bg-gradient-to-b from-[#24170F] to-[#120B07] border-2 border-white/15 flex items-center justify-center shadow-inner touch-none"
                  >
                    {/* Dial SVG Track with Multi-color Spectrum */}
                    <svg className="absolute inset-0 w-full h-full p-3 pointer-events-none -rotate-90">
                      <defs>
                        <linearGradient id="circadianGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#F3B93A" />
                          <stop offset="35%" stopColor="#E84A0F" />
                          <stop offset="65%" stopColor="#AC1917" />
                          <stop offset="100%" stopColor="#F3B93A" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="50%"
                        cy="50%"
                        r="43%"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="43%"
                        fill="none"
                        stroke="url(#circadianGrad)"
                        strokeWidth="8"
                        strokeDasharray="4 6"
                        className="opacity-80"
                      />
                    </svg>

                    {/* Cardinal Hours Labels (12, 18, 00, 06) */}
                    <div className="absolute top-2 text-[10px] font-semibold text-cirqa-amarillo flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5" /> 12:00
                    </div>
                    <div className="absolute right-2 text-[10px] font-semibold text-cirqa-primario">
                      18:00
                    </div>
                    <div className="absolute bottom-2 text-[10px] font-semibold text-cirqa-carmin flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5" /> 00:00
                    </div>
                    <div className="absolute left-2 text-[10px] font-semibold text-cirqa-arena">
                      06:00
                    </div>

                    {/* Draggable indicator knob orbiting the ring */}
                    <motion.div
                      style={{
                        transform: `translate(${indicatorX}px, ${indicatorY}px)`,
                      }}
                      className="absolute w-7 h-7 rounded-full bg-white shadow-[0_0_15px_#ffffff] flex items-center justify-center pointer-events-none z-20"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: isDay ? '#F3B93A' : isTransition ? '#E84A0F' : '#AC1917',
                        }}
                      />
                    </motion.div>

                    {/* Inner Central Biological Readout Card */}
                    <motion.div
                      animate={{
                        scale: isDragging ? 0.97 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex flex-col items-center justify-center text-center p-3 z-10 pointer-events-none shadow-2xl"
                    >
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-cirqa-arena">
                        {isDay ? 'FASE DÍA' : isTransition ? 'TRANSICIÓN' : 'FASE NOCHE'}
                      </span>
                      <span className="text-3xl sm:text-4xl font-light tracking-tight text-white my-0.5">
                        {formatHourString(currentHour)}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-white/50 font-light flex items-center gap-1">
                        <Compass className="w-3 h-3 text-cirqa-arena" /> Arrastrá el dial
                      </span>
                    </motion.div>

                  </div>
                </motion.div>
              </div>

              {/* Subtitle helper */}
              <p className="text-[11px] text-white/50 font-light mt-4 text-center">
                Mantené presionado y girá para explorar las 24h
              </p>
            </div>

            {/* Right: Dynamic Reactive Biological Card */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {isDay && (
                  <motion.div
                    key="modo-dia"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                    className="p-7 sm:p-8 rounded-3xl bg-gradient-to-r from-cirqa-amarillo/20 via-cirqa-amarillo/10 to-transparent border border-cirqa-amarillo/40 text-left shadow-xl"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 text-cirqa-amarillo text-xs font-semibold uppercase tracking-wider">
                        <Sun className="w-4 h-4" />
                        <span>LUZ INTENSA SOLAR (06:00 - 18:00)</span>
                      </div>
                      <span className="text-[10px] font-semibold bg-cirqa-amarillo text-cirqa-negro px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Foco Activo
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-light text-white tracking-tight mb-2">
                      MODO DÍA · CORTISOL & ENERGÍA
                    </h3>
                    
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-cirqa-arena font-medium mb-4">
                      <span>• Cortisol matutino</span>
                      <span>• Alerta cognitiva</span>
                      <span>• Vigor metabólico</span>
                    </div>

                    <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed mb-5">
                      La exposición lumínica de alta energía activa las células ganglionares fotosensibles (ipRGC), enviando señales directas al núcleo supraquiasmático para elevar el cortisol, acelerar el gasto energético y potenciar el rendimiento intelectual sin fatiga.
                    </p>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between text-xs text-white/80">
                      <div>
                        <span className="text-cirqa-amarillo font-semibold block">Filtro Sugerido: CIRQA Día (84%)</span>
                        <span className="text-white/60 font-light text-[11px]">Protege de la fatiga digital manteniendo colores vivos</span>
                      </div>
                      <a
                        href="#tecnologia"
                        className="px-4 py-2 bg-cirqa-amarillo text-cirqa-negro font-semibold rounded-full hover:brightness-110 transition-all text-xs flex items-center gap-1"
                      >
                        <span>Ver Cristal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                )}

                {isTransition && (
                  <motion.div
                    key="modo-transicion"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                    className="p-7 sm:p-8 rounded-3xl bg-gradient-to-r from-cirqa-primario/25 via-cirqa-primario/10 to-transparent border border-cirqa-primario/40 text-left shadow-xl"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 text-cirqa-primario text-xs font-semibold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        <span>CAÍDA SOLAR & CREPÚSCULO (18:00 - 20:00)</span>
                      </div>
                      <span className="text-[10px] font-semibold bg-cirqa-primario text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Transición Suave
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-light text-white tracking-tight mb-2">
                      MODO ATARDECER · DESACELERACIÓN
                    </h3>
                    
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-cirqa-arena font-medium mb-4">
                      <span>• Descenso de luz azul</span>
                      <span>• Relajación ocular</span>
                      <span>• Cierre de jornada</span>
                    </div>

                    <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed mb-5">
                      Conforme el sol desciende, el espectro electromagnético se desplaza hacia tonalidades ámbar. Filtrar el 95% de la luz azul en este período prepara al cerebro para la desconexión gradual y evita el shock lumínico de pantallas nocturnas.
                    </p>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between text-xs text-white/80">
                      <div>
                        <span className="text-cirqa-primario font-semibold block">Filtro Sugerido: CIRQA Transición (95%)</span>
                        <span className="text-white/60 font-light text-[11px]">Equilibrio perfecto para pantallas de 17 a 20 hs</span>
                      </div>
                      <a
                        href="#tecnologia"
                        className="px-4 py-2 bg-cirqa-primario text-white font-semibold rounded-full hover:brightness-110 transition-all text-xs flex items-center gap-1"
                      >
                        <span>Ver Cristal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                )}

                {isNight && (
                  <motion.div
                    key="modo-noche"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                    className="p-7 sm:p-8 rounded-3xl bg-gradient-to-r from-cirqa-carmin/30 via-cirqa-carmin/15 to-transparent border border-cirqa-carmin/45 text-left shadow-xl"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 text-cirqa-carmin text-xs font-semibold uppercase tracking-wider">
                        <Moon className="w-4 h-4" />
                        <span>OSCURIDAD BIOLÓGICA (20:00 - 06:00)</span>
                      </div>
                      <span className="text-[10px] font-semibold bg-cirqa-carmin text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Reparación
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-light text-white tracking-tight mb-2">
                      MODO NOCHE · MELATONINA & REPARACIÓN
                    </h3>
                    
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-cirqa-arena font-medium mb-4">
                      <span>• Melatonina pineal</span>
                      <span>• Autofagia celular</span>
                      <span>• Sueño REM profundo</span>
                    </div>

                    <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed mb-5">
                      El bloqueo casi absoluto de frecuencias azules y verdes (400-550nm) desencadena la cascada pineal de melatonina, el antioxidante mitocondrial más potente del cuerpo humano, iniciando la reparación tisular y la regeneración cerebral nocturna.
                    </p>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between text-xs text-white/80">
                      <div>
                        <span className="text-cirqa-carmin font-semibold block">Filtro Sugerido: CIRQA Noche (100%)</span>
                        <span className="text-white/60 font-light text-[11px]">Máxima protección para lectura y descanso 2h antes de dormir</span>
                      </div>
                      <a
                        href="#tecnologia"
                        className="px-4 py-2 bg-cirqa-carmin text-white font-semibold rounded-full hover:brightness-110 transition-all text-xs flex items-center gap-1"
                      >
                        <span>Ver Cristal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </motion.div>

        {/* ========================================================== */}
        {/* 2. GRILLA INTERACTIVA DE 8 PILARES BIOLÓGICOS (POP-UPS)    */}
        {/* ========================================================== */}
        <div className="relative">
          <div className="text-center mb-12">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-cirqa-arena font-semibold block mb-2">
              SISTEMA INTEGRAL
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-tight">
              Los 8 Pilares Biológicos Afectados por la Luz
            </h3>
            <p className="text-xs text-white/60 font-light mt-1">
              Hacé clic o posá el cursor sobre cada pilar para desplegar la evidencia científica.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {PILLARS.map((pillar) => {
              const IconComp = pillar.icon;
              const isSelected = selectedPillar?.id === pillar.id;

              return (
                <motion.div
                  key={pillar.id}
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => setSelectedPillar(isSelected ? null : pillar)}
                  className={`p-6 sm:p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between text-center group cursor-pointer relative ${
                    isSelected
                      ? 'bg-white/15 border-cirqa-arena shadow-[0_15px_35px_rgba(228,176,112,0.15)] ring-2 ring-cirqa-arena/30'
                      : 'bg-white/5 border-white/10 hover:border-cirqa-arena/40 hover:bg-white/[0.08] shadow-lg'
                  }`}
                >
                  <div>
                    {/* Icon Knob */}
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cirqa-arena mb-4 group-hover:scale-110 group-hover:bg-cirqa-arena group-hover:text-cirqa-negro transition-all duration-300 shadow-sm">
                      <IconComp className="w-6 h-6" />
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold tracking-wider text-white mb-2 uppercase">
                      {pillar.name}
                    </h4>

                    <p className="text-[11px] text-white/70 font-light leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>

                  {/* Micro Trigger Button */}
                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-center gap-1 text-[11px] text-cirqa-arena font-medium group-hover:underline">
                    <span>{isSelected ? 'Cerrar detalle' : 'Explorar ciencia'}</span>
                    <Plus className={`w-3.5 h-3.5 transition-transform duration-300 ${isSelected ? 'rotate-45' : ''}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Floating Glassmorphism Modal / Pop-up Card */}
          <AnimatePresence>
            {selectedPillar && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setSelectedPillar(null)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Floating Glassmorphism Detail Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                  className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto bg-[#18110B]/95 backdrop-blur-2xl border border-cirqa-arena/30 rounded-3xl p-7 sm:p-9 shadow-2xl z-10 text-white"
                >
                  <div className="flex items-start justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cirqa-arena/10 border border-cirqa-arena/30 flex items-center justify-center text-cirqa-arena">
                        {React.createElement(selectedPillar.icon, { className: 'w-5 h-5' })}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-cirqa-arena font-semibold block">
                          Fundamento Científico
                        </span>
                        <h4 className="text-lg font-medium text-white tracking-tight">
                          {selectedPillar.name}
                        </h4>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPillar(null)}
                      className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      aria-label="Cerrar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="my-5 space-y-3">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs text-cirqa-arena font-medium">
                      Eje biológico: <span className="text-white font-normal">{selectedPillar.highlight}</span>
                    </div>

                    <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed">
                      {selectedPillar.scientificDetail}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50 font-light">
                    <span>Fotobiología Circadiana CIRQA</span>
                    <button
                      onClick={() => setSelectedPillar(null)}
                      className="px-5 py-2 bg-cirqa-arena text-cirqa-negro font-semibold rounded-full hover:brightness-110 active:scale-95 transition-all text-xs"
                    >
                      Entendido
                    </button>
                  </div>
                </motion.div>

              </div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </section>
  );
}
