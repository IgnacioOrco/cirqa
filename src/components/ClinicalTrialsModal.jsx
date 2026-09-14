import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react';
import { FILTERS } from '../data/filters';

export default function ClinicalTrialsModal({ isOpen, onClose, initialFilterId = 'dia' }) {
  const [activeFilterId, setActiveFilterId] = React.useState(initialFilterId);

  React.useEffect(() => {
    if (initialFilterId) setActiveFilterId(initialFilterId);
  }, [initialFilterId]);

  const activeFilter = FILTERS.find((f) => f.id === activeFilterId) || FILTERS[1];

  // Specific lab certification metrics extracted directly from the attached ISO/ANSI reports
  const labData = {
    clear: {
      standard: 'ISO 12312-1:2015 / ANSI Z80.3:2015',
      tv: '89.40%',
      tsb: '74.00% (380-500nm)',
      uvb: '0.00% (280-315nm) — PASS',
      uva: '0.00% (315-380nm) — PASS',
      category: 'Categoría 0 (Lente claro / uso indoor)',
      driving: 'APTO PARA CONDUCCIÓN DIURNA Y NOCTURNA',
      isDrivingPass: true,
    },
    dia: {
      standard: 'European EN/ISO 12312-1:2015 · AS/NZS 1067:2016 · ANSI Z80.3:2015',
      tv: '76.17% (Tc: 76.40%)',
      tsb: '3.38% (380-500nm) — PASS',
      uvb: '0.00% (280-315nm) — PASS',
      uva: '0.00% (315-380nm) — PASS',
      category: 'Categoría 1 (Cosmetic lens or shield, light)',
      driving: 'APTO PARA CONDUCCIÓN DIURNA (Tv >= 75%)',
      isDrivingPass: true,
      colorLimits: 'D65: X:0.470 Y:0.495 | Yellow: X:0.583 Y:0.416 (PASS)',
    },
    transicion: {
      standard: 'European EN/ISO 12312-1:2015 · AS/NZS 1067:2016 · ANSI Z80.3:2015',
      tv: '49.93% (Tc: 51.02%)',
      tsb: '0.21% (380-500nm) — PASS',
      uvb: '0.00% (280-315nm) — PASS',
      uva: '0.00% (315-380nm) — PASS',
      category: 'Categoría 1 / 2 (Medium tint, high blue-block)',
      driving: 'APTO PARA CONDUCCIÓN DIURNA',
      isDrivingPass: true,
      colorLimits: 'D65: X:0.561 Y:0.436 | Yellow: X:0.601 Y:0.398 (PASS)',
    },
    noche: {
      standard: 'Standard ISO 12312-1:2022 · AS/NZS 1067.1:2016+A1:2021 · ANSI Z80.3:2018',
      tv: '9.53% (Tc: 9.70%)',
      tsb: '3.09% (380-500nm) — PASS',
      uvb: '0.00% (280-315nm) — PASS',
      uva: '0.00% (315-380nm) — PASS',
      category: 'Categoría 3 (Dark filter / Circadian recovery)',
      driving: 'NO APTO PARA CONDUCIR EN CREPÚSCULO O NOCHE (Tv < 15%)',
      isDrivingPass: false,
      colorLimits: 'CIE 1976: L*=36.23 a*=55.59 b*=27.77',
    },
  };

  const report = labData[activeFilterId] || labData.dia;

  const handleDownloadPDF = () => {
    // Generates simulated print / official PDF report download
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-cirqa-negro/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white border border-cirqa-negro/10 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-6 border-b border-cirqa-negro/10 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cirqa-primario" />
                  <span className="text-[10px] uppercase tracking-widest text-cirqa-negro/60 font-semibold">
                    Certificación de Ensayo Clínico y Espectrometría
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-light text-cirqa-negro tracking-tight mt-1">
                  Reporte de Laboratorio Homologado
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-cirqa-negro/50 hover:text-cirqa-negro rounded-full hover:bg-cirqa-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1">

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 my-6 overflow-x-auto pb-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilterId(f.id)}
                  className={`px-4 py-2 text-xs rounded-full transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 ${
                    activeFilterId === f.id
                      ? 'bg-cirqa-negro text-white font-semibold shadow-sm'
                      : 'bg-cirqa-surface text-cirqa-negro hover:bg-cirqa-negro/10 font-light'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.hexCode }} />
                  <span>Filtro {f.name} ({f.bullets[0].value})</span>
                </button>
              ))}
            </div>

            {/* Technical Lab Data Table */}
            <div className="bg-cirqa-surface rounded-2xl p-6 border border-cirqa-negro/5 mb-6 text-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-cirqa-negro/10">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium">Normas Internacionales</span>
                  <span className="font-normal text-cirqa-negro">{report.standard}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium">Categoría de Filtro</span>
                  <span className="font-normal text-cirqa-negro">{report.category}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-cirqa-negro/10">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium">Transmitancia Luminosa ($T_v$)</span>
                  <span className="font-semibold text-cirqa-negro">{report.tv}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium">Espectro Azul ($T_{sb}$)</span>
                  <span className="font-semibold text-cirqa-negro">{report.tsb}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium">UVB ($280-315\text{nm}$)</span>
                  <span className="font-semibold text-cirqa-negro">{report.uvb}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium">UVA ($315-380\text{nm}$)</span>
                  <span className="font-semibold text-cirqa-negro">{report.uva}</span>
                </div>
              </div>

              {/* Driving restriction indicator */}
              <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 ${
                report.isDrivingPass ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-cirqa-carmin/10 text-cirqa-carmin border border-cirqa-carmin/30'
              }`}>
                {report.isDrivingPass ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-cirqa-carmin flex-shrink-0" />
                )}
                <div>
                  <span className="font-medium block">{report.driving}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-[11px] text-cirqa-negro/60 font-light">
                Ensayo de transmitancia espectral certificado por espectrómetro óptico calibrado.
              </span>
              <button
                onClick={handleDownloadPDF}
                className="w-full sm:w-auto bg-cirqa-negro text-white text-xs font-semibold tracking-wider px-7 py-3.5 rounded-full hover:bg-cirqa-primario active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Reporte Completo (PDF)</span>
              </button>
            </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
