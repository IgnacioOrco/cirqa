import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Eye,
  Sun,
  Moon,
  Sunset,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Layers,
} from 'lucide-react';
import { FILTERS } from '../data/filters';

const TABLE_COLUMNS = [
  {
    id: 'noche',
    name: 'NOCHE',
    label: 'Filtro Noche',
    tag: 'NOCHE 20HS · MELATONINA',
    colorHex: '#AC1917',
    tintBg: 'rgba(172, 25, 23, 0.45)',
    filterData: FILTERS.find((f) => f.id === 'noche'),
    usoPrevisto: 'Uso nocturno y descanso visual previo a dormir',
    icon: Moon,
    bloqueoAzul: 'Casi 100% (99%)',
    bloqueoPct: 99,
    vlt: '9.53%',
    vltDesc: 'Tv < 15% (Categoría oscura)',
    vltPct: 9.53,
    beneficioClave: 'Maximiza el apoyo al sueño profundo y la producción natural de melatonina.',
    drivingWarning: true,
    warningText: 'No apto para conducir',
    warningDetail: 'Norma ISO 12312-1:2022 (Tv < 15%) — Uso exclusivo nocturno en interiores.',
    pdfUrl: '/certificates/CIRQA-Certificado-Filtro-Noche.pdf',
    standard: 'ISO 12312-1:2022',
  },
  {
    id: 'transicion',
    name: 'TRANSICIÓN',
    label: 'Filtro Transición',
    tag: 'TARDE 17HS · CAÍDA SOLAR',
    colorHex: '#E84A0F',
    tintBg: 'rgba(232, 74, 15, 0.35)',
    filterData: FILTERS.find((f) => f.id === 'transicion'),
    usoPrevisto: 'Uso diario en pantallas (trabajo, estudio y juegos al atardecer)',
    icon: Sunset,
    bloqueoAzul: '95%',
    bloqueoPct: 95,
    vlt: '49.93%',
    vltDesc: 'Balance óptico tarde',
    vltPct: 49.93,
    beneficioClave: 'Mejora el enfoque, relaja los ojos y previene la fatiga visual al caer el sol.',
    drivingWarning: false,
    pdfUrl: '/certificates/CIRQA-Certificado-Filtro-Transicion.pdf',
    standard: 'ISO 12312-1:2015',
  },
  {
    id: 'dia',
    name: 'DÍA',
    label: 'Filtro Día',
    tag: 'DÍA · PANTALLAS Y FOCO',
    colorHex: '#F3B93A',
    tintBg: 'rgba(243, 185, 58, 0.35)',
    filterData: FILTERS.find((f) => f.id === 'dia'),
    usoPrevisto: 'Uso diurno continuo en oficina y exposición a iluminación LED',
    icon: Sun,
    bloqueoAzul: '84%',
    bloqueoPct: 84,
    vlt: '76.17%',
    vltDesc: 'Claridad luminosa alta',
    vltPct: 76.17,
    beneficioClave: 'Protección equilibrada durante todo el día con percepción visual natural del color.',
    drivingWarning: false,
    pdfUrl: '/certificates/CIRQA-Certificado-Filtro-Dia.pdf',
    standard: 'ISO 12312-1:2015',
  },
  {
    id: 'clear',
    name: 'CLEAR',
    label: 'Filtro Clear',
    tag: 'CREATIVIDAD · COLOR REAL',
    colorHex: '#64748b',
    tintBg: 'rgba(235, 243, 250, 0.75)',
    filterData: FILTERS.find((f) => f.id === 'clear'),
    usoPrevisto: 'Diseño gráfico, edición de video, fotografía y fidelidad cromática pura',
    icon: Monitor,
    bloqueoAzul: '26%',
    bloqueoPct: 26,
    vlt: '89.40%',
    vltDesc: 'Fidelidad cromática 100%',
    vltPct: 89.4,
    beneficioClave: 'Protege contra la fatiga de luz azul manteniendo los colores perfectamente exactos.',
    drivingWarning: false,
    pdfUrl: '/certificates/CIRQA-Certificado-Filtro-Dia.pdf',
    standard: 'ISO 12312-1:2015',
  },
];

export default function ComparisonTable({ onSelectFilterForPurchase, onOpenTrials }) {
  const [hoveredCol, setHoveredCol] = useState(null);
  const [mobileFilterIndex, setMobileFilterIndex] = useState(0);
  const [showSummaryList, setShowSummaryList] = useState(false);

  // Swipe detection for mobile cards
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const activeMobileFilter = TABLE_COLUMNS[mobileFilterIndex];
  const IconComponent = activeMobileFilter.icon;

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next
      setMobileFilterIndex((prev) => (prev < TABLE_COLUMNS.length - 1 ? prev + 1 : 0));
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev
      setMobileFilterIndex((prev) => (prev > 0 ? prev - 1 : TABLE_COLUMNS.length - 1));
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const goToPrev = () => {
    setMobileFilterIndex((prev) => (prev > 0 ? prev - 1 : TABLE_COLUMNS.length - 1));
  };

  const goToNext = () => {
    setMobileFilterIndex((prev) => (prev < TABLE_COLUMNS.length - 1 ? prev + 1 : 0));
  };

  const handleOpenCert = (filterId, pdfUrl) => {
    if (onOpenTrials) {
      onOpenTrials(filterId);
    } else {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <section id="tabla-comparativa" className="py-16 sm:py-24 bg-white text-cirqa-negro border-b border-cirqa-negro/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.24em] text-[#B73302] mb-2 px-3 py-1 rounded-full bg-[#B73302]/8">
            <Sparkles className="w-3 h-3 text-[#B73302]" />
            ESPECIFICACIONES TÉCNICAS
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-light text-cirqa-negro tracking-tight mt-1">
            COMPARACIÓN DE LENTES
          </h2>
          <p className="text-xs sm:text-sm text-cirqa-muted mt-3 max-w-xl mx-auto font-light leading-relaxed">
            Ingeniería óptica espectral adaptada a cada fase de tu ciclo circadiano y requerimientos visuales.
          </p>
        </div>

        {/* =========================================================================
            MOBILE VIEW (< 768px): Tarjeta Interactiva, Selectores Táctiles y Visuales
            Evita el corte horizontal y ofrece una experiencia atractiva y fluida
           ========================================================================= */}
        <div className="block md:hidden">
          
          {/* 1. Selector de Filtros estilo Segmented Control */}
          <div className="flex items-center justify-between gap-1 p-1.5 bg-cirqa-surface rounded-2xl border border-cirqa-negro/10 shadow-sm mb-6">
            {TABLE_COLUMNS.map((col, index) => {
              const isActive = mobileFilterIndex === index;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setMobileFilterIndex(index)}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-cirqa-negro shadow-md scale-[1.02]'
                      : 'text-cirqa-negro/60 hover:text-cirqa-negro hover:bg-white/50'
                  }`}
                  style={isActive ? { borderBottom: `2.5px solid ${col.colorHex}` } : {}}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform shadow-xs"
                    style={{ backgroundColor: col.colorHex }}
                  />
                  <span className="text-[11px] font-bold uppercase truncate">{col.name}</span>
                </button>
              );
            })}
          </div>

          {/* 2. Tarjeta Principal del Filtro Activo con soporte táctil de Swipe */}
          <div
            className="touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMobileFilter.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="bg-cirqa-surface/70 rounded-3xl p-5 border border-cirqa-negro/10 shadow-lg relative overflow-hidden"
              >
                {/* Sutil halo cromático de fondo con el color del filtro */}
                <div
                  className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: activeMobileFilter.colorHex }}
                />

                {/* Encabezado de la Tarjeta Móvil */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-cirqa-negro/10 relative">
                  <div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-block mb-1.5"
                      style={{
                        backgroundColor: `${activeMobileFilter.colorHex}15`,
                        color: activeMobileFilter.colorHex,
                      }}
                    >
                      {activeMobileFilter.tag}
                    </span>
                    <h3 className="text-2xl font-light tracking-tight text-cirqa-negro">
                      Lente <span className="font-semibold">{activeMobileFilter.name}</span>
                    </h3>
                  </div>

                  {/* Lente Visual con reflejo */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-16 h-10 rounded-full border-2 flex items-center justify-center shadow-md relative overflow-hidden"
                      style={{
                        borderColor: activeMobileFilter.colorHex,
                        backgroundColor: activeMobileFilter.tintBg,
                      }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeMobileFilter.colorHex }} />
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Métricas Visuales Destacadas: Barras de Bloqueo y VLT */}
                <div className="grid grid-cols-2 gap-3 my-4">
                  
                  {/* Bloqueo Luz Azul */}
                  <div className="bg-white rounded-2xl p-3.5 border border-cirqa-negro/5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cirqa-negro/70 uppercase tracking-wider mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-cirqa-negro/70 flex-shrink-0" />
                      <span>Luz Azul</span>
                    </div>
                    <div
                      className="text-2xl font-bold tracking-tight"
                      style={{ color: activeMobileFilter.id !== 'clear' ? activeMobileFilter.colorHex : '#201610' }}
                    >
                      {activeMobileFilter.bloqueoAzul}
                    </div>
                    {/* Barra de progreso visual */}
                    <div className="w-full bg-cirqa-surface h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${activeMobileFilter.bloqueoPct}%`,
                          backgroundColor: activeMobileFilter.colorHex,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-cirqa-muted block mt-1">Filtrado espectral</span>
                  </div>

                  {/* Transmitancia VLT */}
                  <div className="bg-white rounded-2xl p-3.5 border border-cirqa-negro/5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cirqa-negro/70 uppercase tracking-wider mb-1">
                      <Eye className="w-3.5 h-3.5 text-cirqa-negro/70 flex-shrink-0" />
                      <span>Transmisión VLT</span>
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-cirqa-negro">
                      {activeMobileFilter.vlt}
                    </div>
                    {/* Barra de paso de luz */}
                    <div className="w-full bg-cirqa-surface h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full bg-cirqa-negro/40 transition-all duration-500"
                        style={{ width: `${activeMobileFilter.vltPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-cirqa-muted block mt-1">{activeMobileFilter.vltDesc}</span>
                  </div>

                </div>

                {/* Especificaciones Detalladas en Bloques Claros */}
                <div className="space-y-3 mb-5">
                  
                  {/* Fila: Uso previsto */}
                  <div className="bg-white/80 rounded-2xl p-3.5 border border-cirqa-negro/5 flex items-start gap-3">
                    <div
                      className="p-2 rounded-xl flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${activeMobileFilter.colorHex}15`,
                        color: activeMobileFilter.colorHex,
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cirqa-muted block">
                        Uso previsto
                      </span>
                      <p className="text-xs text-cirqa-negro font-medium leading-relaxed mt-0.5">
                        {activeMobileFilter.usoPrevisto}
                      </p>
                    </div>
                  </div>

                  {/* Fila: Beneficio clave */}
                  <div className="bg-white/80 rounded-2xl p-3.5 border border-cirqa-negro/5 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-cirqa-negro/5 text-cirqa-negro flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cirqa-muted block">
                        Beneficio clave
                      </span>
                      <p className="text-xs text-cirqa-negro font-normal leading-relaxed mt-0.5">
                        {activeMobileFilter.beneficioClave}
                      </p>
                    </div>
                  </div>

                  {/* Advertencia especial de conducción (si aplica) */}
                  {activeMobileFilter.drivingWarning && (
                    <div className="bg-[#AC1917]/10 rounded-2xl p-3.5 border border-[#AC1917]/25 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-[#AC1917] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-[#AC1917] block">
                          {activeMobileFilter.warningText}
                        </span>
                        <p className="text-[11px] text-[#AC1917]/90 leading-tight mt-0.5">
                          {activeMobileFilter.warningDetail}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Certificación y Norma */}
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/50 text-[11px] text-cirqa-muted border border-cirqa-negro/5">
                    <span>Norma de ensayo:</span>
                    <span className="font-semibold text-cirqa-negro">{activeMobileFilter.standard}</span>
                  </div>

                </div>

                {/* Botones de Acción en Móvil */}
                <div className="space-y-2.5 pt-2 border-t border-cirqa-negro/10">
                  {onSelectFilterForPurchase && (
                    <button
                      type="button"
                      onClick={() => onSelectFilterForPurchase(activeMobileFilter.id)}
                      className="w-full bg-cirqa-negro hover:bg-cirqa-primario text-white text-xs font-semibold tracking-wider uppercase py-3.5 px-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                    >
                      <span>Elegir Filtro {activeMobileFilter.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenCert(activeMobileFilter.id, activeMobileFilter.pdfUrl)}
                    className="w-full bg-white hover:bg-cirqa-surface text-cirqa-negro text-xs font-semibold tracking-wider uppercase py-3 px-4 rounded-full border border-cirqa-negro/15 flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98"
                  >
                    <FileText className="w-3.5 h-3.5 text-cirqa-primario" />
                    <span>Ver Certificado de Ensayo PDF</span>
                  </button>
                </div>

              </motion.div>
            </AnimatePresence>

            {/* Controles de Navegación Móvil (Flechas y Paginación) */}
            <div className="flex items-center justify-between mt-4 px-2">
              <button
                type="button"
                onClick={goToPrev}
                className="flex items-center gap-1 text-xs font-semibold text-cirqa-negro/75 hover:text-cirqa-negro py-2 px-3 rounded-full bg-cirqa-surface border border-cirqa-negro/10 shadow-xs"
                aria-label="Filtro anterior"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {/* Indicadores de Paginación */}
              <div className="flex items-center gap-1.5">
                {TABLE_COLUMNS.map((col, idx) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setMobileFilterIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      mobileFilterIndex === idx ? 'w-6' : 'w-2 bg-cirqa-negro/20 hover:bg-cirqa-negro/40'
                    }`}
                    style={mobileFilterIndex === idx ? { backgroundColor: col.colorHex } : {}}
                    aria-label={`Ver filtro ${col.name}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={goToNext}
                className="flex items-center gap-1 text-xs font-semibold text-cirqa-negro/75 hover:text-cirqa-negro py-2 px-3 rounded-full bg-cirqa-surface border border-cirqa-negro/10 shadow-xs"
                aria-label="Siguiente filtro"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Resumen Compacto de los 4 filtros en Móvil */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setShowSummaryList(!showSummaryList)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cirqa-muted hover:text-cirqa-negro py-1.5 px-3 rounded-full bg-cirqa-surface border border-cirqa-negro/10 transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{showSummaryList ? 'Ocultar resumen general' : 'Ver resumen de los 4 filtros juntos'}</span>
              </button>
            </div>

            {/* Lista Desplegable de Resumen Compacto */}
            {showSummaryList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-cirqa-surface rounded-2xl p-3 border border-cirqa-negro/10 space-y-2"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-cirqa-muted block px-1">
                  Resumen comparativo rápido
                </span>
                {TABLE_COLUMNS.map((col, index) => (
                  <div
                    key={col.id}
                    onClick={() => {
                      setMobileFilterIndex(index);
                      setShowSummaryList(false);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                      mobileFilterIndex === index
                        ? 'bg-white shadow-sm border border-cirqa-negro/10'
                        : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: col.colorHex }} />
                      <div>
                        <span className="text-xs font-bold text-cirqa-negro block">{col.name}</span>
                        <span className="text-[10px] text-cirqa-muted">{col.usoPrevisto}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold" style={{ color: col.colorHex }}>
                        {col.bloqueoAzul}
                      </span>
                      <span className="text-[10px] text-cirqa-muted block">VLT {col.vlt}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

          </div>

        </div>

        {/* =========================================================================
            DESKTOP VIEW (>= 768px): Matriz Comparativa Completa en Grid
           ========================================================================= */}
        <div className="hidden md:block">
          <div className="bg-cirqa-surface/40 rounded-3xl p-6 sm:p-8 border border-cirqa-negro/10 shadow-sm">
            
            {/* Header Row: Lens Headers & Previews */}
            <div className="grid grid-cols-5 pb-6 border-b border-cirqa-negro/15 items-end">
              <div className="pr-4 text-[11px] uppercase font-bold tracking-widest text-cirqa-negro/70">
                Parámetro
              </div>
              {TABLE_COLUMNS.map((col) => (
                <div
                  key={col.id}
                  onMouseEnter={() => setHoveredCol(col.id)}
                  onMouseLeave={() => setHoveredCol(null)}
                  className={`px-4 py-2 text-center rounded-2xl transition-all duration-200 cursor-pointer ${
                    hoveredCol === col.id ? 'bg-white shadow-sm' : ''
                  }`}
                  onClick={() => onSelectFilterForPurchase && onSelectFilterForPurchase(col.id)}
                >
                  <div className="h-20 rounded-2xl bg-white border border-cirqa-negro/5 flex items-center justify-center p-3 mb-3 shadow-sm relative group">
                    <div
                      className="w-20 h-10 rounded-full border-2 flex items-center justify-center shadow-sm relative overflow-hidden transition-transform group-hover:scale-105"
                      style={{ borderColor: col.colorHex, backgroundColor: col.tintBg }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.colorHex }} />
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold tracking-tight text-cirqa-negro">
                    {col.name}
                  </h3>
                  <span className="text-[10px] text-cirqa-muted block font-medium mt-0.5">
                    {col.tag}
                  </span>
                </div>
              ))}
            </div>

            {/* Row 1: Uso Previsto */}
            <div className="grid grid-cols-5 py-5 border-b border-cirqa-negro/10 items-center">
              <div className="pr-4 text-xs font-semibold text-cirqa-negro">
                Uso previsto
              </div>
              {TABLE_COLUMNS.map((col) => (
                <div
                  key={col.id}
                  onMouseEnter={() => setHoveredCol(col.id)}
                  onMouseLeave={() => setHoveredCol(null)}
                  className={`px-4 py-3 text-center text-xs font-normal text-cirqa-negro/90 rounded-xl transition-colors duration-200 leading-relaxed ${
                    hoveredCol === col.id ? 'bg-white shadow-xs' : ''
                  }`}
                >
                  {col.usoPrevisto}
                </div>
              ))}
            </div>

            {/* Row 2: Bloqueo de Luz Azul */}
            <div className="grid grid-cols-5 py-5 border-b border-cirqa-negro/10 items-center">
              <div className="pr-4 text-xs font-semibold text-cirqa-negro">
                Bloqueo de luz azul
              </div>
              {TABLE_COLUMNS.map((col) => (
                <div
                  key={col.id}
                  onMouseEnter={() => setHoveredCol(col.id)}
                  onMouseLeave={() => setHoveredCol(null)}
                  className={`px-4 py-3 text-center rounded-xl transition-colors duration-200 ${
                    hoveredCol === col.id ? 'bg-white shadow-xs' : ''
                  }`}
                >
                  <div
                    className="text-base font-bold"
                    style={{ color: col.id !== 'clear' ? col.colorHex : '#201610' }}
                  >
                    {col.bloqueoAzul}
                  </div>
                  <div className="w-20 mx-auto bg-cirqa-negro/10 h-1 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${col.bloqueoPct}%`,
                        backgroundColor: col.colorHex,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Row 3: Transmisión VLT */}
            <div className="grid grid-cols-5 py-5 border-b border-cirqa-negro/10 items-center">
              <div className="pr-4 text-xs font-semibold text-cirqa-negro">
                Transmisión VLT
              </div>
              {TABLE_COLUMNS.map((col) => (
                <div
                  key={col.id}
                  onMouseEnter={() => setHoveredCol(col.id)}
                  onMouseLeave={() => setHoveredCol(null)}
                  className={`px-4 py-3 text-center text-xs font-normal text-cirqa-negro/90 rounded-xl transition-colors duration-200 ${
                    hoveredCol === col.id ? 'bg-white shadow-xs' : ''
                  }`}
                >
                  <span className="font-semibold">{col.vlt}</span>
                  <span className="text-[10px] text-cirqa-muted block mt-0.5">{col.vltDesc}</span>
                </div>
              ))}
            </div>

            {/* Row 4: Beneficio Clave */}
            <div className="grid grid-cols-5 py-5 border-b border-cirqa-negro/10 items-center">
              <div className="pr-4 text-xs font-semibold text-cirqa-negro">
                Beneficio clave
              </div>
              {TABLE_COLUMNS.map((col) => (
                <div
                  key={col.id}
                  onMouseEnter={() => setHoveredCol(col.id)}
                  onMouseLeave={() => setHoveredCol(null)}
                  className={`px-4 py-3 text-center text-xs font-normal text-cirqa-negro/90 rounded-xl transition-colors duration-200 leading-relaxed ${
                    hoveredCol === col.id ? 'bg-white shadow-xs' : ''
                  }`}
                >
                  <div>{col.beneficioClave}</div>
                  {col.drivingWarning && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-[10px] text-cirqa-carmin font-semibold bg-cirqa-carmin/10 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        No apto para conducir (Tv &lt; 15%)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Row 5: Action Buttons - Certificado Oficial y Ensayo */}
            <div className="grid grid-cols-5 pt-6 items-center">
              <div className="pr-4 text-xs font-semibold text-cirqa-negro">
                Certificación
              </div>
              {TABLE_COLUMNS.map((col) => (
                <div
                  key={col.id}
                  className="px-3 py-3 text-center rounded-2xl space-y-2"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenCert(col.id, col.pdfUrl)}
                    className="w-full bg-cirqa-negro hover:bg-cirqa-primario text-white text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase py-2.5 px-2 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95"
                    title={`Ver estudio y certificado oficial para filtro ${col.name}`}
                  >
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Ver Certificado PDF</span>
                  </button>

                  {onSelectFilterForPurchase && (
                    <button
                      type="button"
                      onClick={() => onSelectFilterForPurchase(col.id)}
                      className="w-full text-[10px] font-semibold text-cirqa-primario hover:text-cirqa-negro py-1 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Configurar {col.name}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
