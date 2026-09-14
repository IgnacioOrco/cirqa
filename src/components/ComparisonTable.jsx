import React, { useState } from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { FILTERS } from '../data/filters';

const TABLE_COLUMNS = [
  {
    id: 'noche',
    name: 'NOCHE',
    colorHex: '#AC1917',
    tintBg: 'rgba(172, 25, 23, 0.45)',
    filterData: FILTERS.find((f) => f.id === 'noche'),
    usoPrevisto: 'Uso nocturno y descanso visual',
    bloqueoAzul: 'Casi 100% (99%)',
    vlt: '9.53% (Tv < 15%)',
    beneficioClave: 'Maximiza el apoyo al sueño y la producción natural de melatonina',
    drivingWarning: true,
  },
  {
    id: 'transicion',
    name: 'TRANSICION',
    colorHex: '#E84A0F',
    tintBg: 'rgba(232, 74, 15, 0.35)',
    filterData: FILTERS.find((f) => f.id === 'transicion'),
    usoPrevisto: 'Uso diario en pantallas (trabajo, estudio, juegos al atardecer)',
    bloqueoAzul: '95%',
    vlt: '49.93%',
    beneficioClave: 'Mejora la concentración y reduce la fatiga visual digital en caída solar',
    drivingWarning: false,
  },
  {
    id: 'dia',
    name: 'DIA',
    colorHex: '#F3B93A',
    tintBg: 'rgba(243, 185, 58, 0.35)',
    filterData: FILTERS.find((f) => f.id === 'dia'),
    usoPrevisto: 'Uso diario diurno y protección equilibrada',
    bloqueoAzul: '84%',
    vlt: '76.17%',
    beneficioClave: 'Ofrece una protección cómoda durante todo el día con percepción natural del color',
    drivingWarning: false,
  },
  {
    id: 'clear',
    name: 'CLEAR',
    colorHex: '#94a3b8',
    tintBg: 'rgba(235, 243, 250, 0.35)',
    filterData: FILTERS.find((f) => f.id === 'clear'),
    usoPrevisto: 'Juegos, diseño, edición, trabajo creativo y uso profesional de pantallas',
    bloqueoAzul: '26%',
    vlt: '89.40% (alta fidelidad)',
    beneficioClave: 'Protege contra la luz azul manteniendo los colores claros y precisos',
    drivingWarning: false,
  },
];

export default function ComparisonTable({ onSelectFilterForPurchase }) {
  const [hoveredCol, setHoveredCol] = useState(null);

  return (
    <section id="tabla-comparativa" className="py-24 bg-white text-cirqa-negro border-b border-cirqa-negro/5">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.24em] text-cirqa-primario block mb-2">
            ESPECIFICACIONES TÉCNICAS
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-cirqa-negro tracking-tight">
            COMPARACION DE LENTES
          </h2>
        </div>

        {/* Modern CSS Grid Matrix (NO HTML <table>, Open design, soft rounded blocks) */}
        <div className="overflow-x-auto pt-2 pb-6 px-1">
          <div className="min-w-[760px] bg-cirqa-surface/40 rounded-3xl p-6 sm:p-8 border border-cirqa-negro/10 shadow-sm">
            
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
                  className={`px-4 py-2 text-center rounded-2xl transition-all duration-200 ${
                    hoveredCol === col.id ? 'bg-white shadow-sm' : ''
                  }`}
                >
                  <div className="h-20 rounded-2xl bg-white border border-cirqa-negro/5 flex items-center justify-center p-3 mb-3 shadow-sm">
                    <div
                      className="w-20 h-10 rounded-full border-2 flex items-center justify-center shadow-sm"
                      style={{ borderColor: col.colorHex, backgroundColor: col.tintBg }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.colorHex }} />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold tracking-tight text-cirqa-negro">
                    {col.name}
                  </h3>
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
                  className={`px-4 py-3 text-center text-xs font-normal text-cirqa-negro/90 rounded-xl transition-colors duration-200 ${
                    hoveredCol === col.id ? 'bg-white' : ''
                  }`}
                >
                  {col.usoPrevisto}
                </div>
              ))}
            </div>

            {/* Row 2: Bloqueo de Luz Azul */}
            <div className="grid grid-cols-5 py-5 border-b border-cirqa-negro/5 items-center">
              <div className="pr-4 text-xs font-medium text-cirqa-negro">
                Bloqueo de luz azul
              </div>
              {TABLE_COLUMNS.map((col) => (
                <div
                  key={col.id}
                  onMouseEnter={() => setHoveredCol(col.id)}
                  onMouseLeave={() => setHoveredCol(null)}
                  className={`px-4 py-3 text-center text-sm font-bold rounded-xl transition-colors duration-200 ${
                    hoveredCol === col.id ? 'bg-white' : ''
                  }`}
                  style={{ color: col.id !== 'clear' ? col.colorHex : '#201610' }}
                >
                  {col.bloqueoAzul}
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
                    hoveredCol === col.id ? 'bg-white' : ''
                  }`}
                >
                  {col.vlt}
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
                    hoveredCol === col.id ? 'bg-white' : ''
                  }`}
                >
                  <div>{col.beneficioClave}</div>
                  {col.drivingWarning && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-[10px] text-cirqa-carmin font-semibold bg-cirqa-carmin/10 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        No apto para conducir ($T_v &lt; 15\%$)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Row 5: Action Buttons - Modo Próximamente */}
            <div className="grid grid-cols-5 pt-6 items-center">
              <div className="pr-4 text-xs font-medium text-cirqa-negro">
                Estado
              </div>
              {TABLE_COLUMNS.map((col) => (
                <div
                  key={col.id}
                  className="px-4 py-3 text-center rounded-2xl"
                >
                  <button
                    type="button"
                    disabled
                    className="w-full bg-cirqa-negro/20 text-cirqa-negro/50 cursor-not-allowed shadow-none text-[11px] font-bold tracking-wider uppercase py-3.5 px-3 rounded-full flex items-center justify-center gap-1.5"
                    aria-disabled="true"
                  >
                    <span>PRÓXIMAMENTE</span>
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
