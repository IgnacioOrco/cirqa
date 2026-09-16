import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ShieldCheck, AlertTriangle, CheckCircle, Eye, ExternalLink, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { FILTERS } from '../data/filters';

export default function ClinicalTrialsModal({ isOpen, onClose, initialFilterId = 'dia' }) {
  const [activeFilterId, setActiveFilterId] = useState(initialFilterId);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  useEffect(() => {
    if (initialFilterId) setActiveFilterId(initialFilterId);
  }, [initialFilterId]);

  const activeFilter = FILTERS.find((f) => f.id === activeFilterId) || FILTERS[1];

  // Datos técnicos homologados extraídos directamente de los informes de laboratorio oficiales
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
      pdfUrl: '/certificates/CIRQA-Certificado-Filtro-Dia.pdf',
      pdfFilename: 'CIRQA-Certificado-Filtro-Clear.pdf',
      reportTitle: 'Certificación Homologada Internacional ISO 12312-1',
    },
    dia: {
      standard: 'European EN/ISO 12312-1-2015 · AS/NZS 1067-2016 · ANSI Z80.3-2015',
      tv: '76.17% (Tc: 76.40%)',
      tsb: '3.38% (380-500nm) — PASS',
      uvb: '0.00% (280-315nm) — PASS',
      uva: '0.00% (315-380nm) — PASS',
      category: 'Categoría 1 (Cosmetic lens or shield, light)',
      driving: 'APTO PARA CONDUCCIÓN DIURNA (Tv >= 75%)',
      isDrivingPass: true,
      colorLimits: 'D65: X:0.470 Y:0.495 | Yellow: X:0.583 Y:0.416 (PASS)',
      pdfUrl: '/certificates/CIRQA-Certificado-Filtro-Dia.pdf',
      pdfFilename: 'CIRQA-Certificado-Filtro-Dia-76.pdf',
      reportTitle: 'Reporte Oficial de Espectrometría — Filtro Día (76.17%)',
    },
    transicion: {
      standard: 'European EN/ISO 12312-1-2015 · AS/NZS 1067-2016 · ANSI Z80.3-2015',
      tv: '49.93% (Tc: 51.02%)',
      tsb: '0.21% (380-500nm) — PASS',
      uvb: '0.00% (280-315nm) — PASS',
      uva: '0.00% (315-380nm) — PASS',
      category: 'Categoría 1 / 2 (Medium tint, high blue-block)',
      driving: 'APTO PARA CONDUCCIÓN DIURNA',
      isDrivingPass: true,
      colorLimits: 'D65: X:0.561 Y:0.436 | Yellow: X:0.601 Y:0.398 (PASS)',
      pdfUrl: '/certificates/CIRQA-Certificado-Filtro-Transicion.pdf',
      pdfFilename: 'CIRQA-Certificado-Filtro-Transicion-UV8008.pdf',
      reportTitle: 'Reporte Oficial de Ensayo Óptico UV-8008 AR B/G — Filtro Transición (49.93%)',
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
      pdfUrl: '/certificates/CIRQA-Certificado-Filtro-Noche.pdf',
      pdfFilename: 'CIRQA-Certificado-Filtro-Noche-ISO2022.pdf',
      reportTitle: 'Lens Certification Report Oficial 2023-11-02 — Filtro Noche (9.53%)',
    },
  };

  const report = labData[activeFilterId] || labData.dia;

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
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-cirqa-negro/10 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-5 border-b border-cirqa-negro/10 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cirqa-primario" />
                  <span className="text-[10px] uppercase tracking-widest text-cirqa-negro/60 font-semibold">
                    Certificación de Ensayo Clínico y Espectrometría
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-light text-cirqa-negro tracking-tight mt-1">
                  Reportes de Laboratorio Oficiales
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-cirqa-negro/50 hover:text-cirqa-negro rounded-full hover:bg-cirqa-surface transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 mt-4">

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setActiveFilterId(f.id);
                    }}
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

              {/* Botón de toggle para visor embebido de PDF */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setShowPdfViewer(!showPdfViewer)}
                  className="inline-flex items-center gap-2 text-xs font-medium text-cirqa-primario hover:text-[#d03d07] transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>{showPdfViewer ? 'Ocultar visor de documento' : 'Previsualizar escaneo de laboratorio original'}</span>
                  {showPdfViewer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <span className="text-[11px] text-cirqa-negro/50 hidden sm:inline-block">
                  Documento escaneado de spectrophotómetro calibrado
                </span>
              </div>

              {/* Visor de PDF Embebido */}
              <AnimatePresence>
                {showPdfViewer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-2xl border border-cirqa-negro/15 bg-neutral-900 shadow-xl mb-6"
                  >
                    <div className="bg-[#1C140F] text-white px-4 py-2.5 flex items-center justify-between text-xs font-light border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-cirqa-arena" />
                        <span className="font-medium text-white/90 text-[11px] sm:text-xs truncate max-w-xs sm:max-w-md">
                          {report.reportTitle}
                        </span>
                      </div>
                      <a
                        href={report.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-cirqa-arena hover:underline flex items-center gap-1 flex-shrink-0"
                      >
                        <span>Abrir pestaña completa</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <iframe
                      src={`${report.pdfUrl}#toolbar=1&navpanes=0`}
                      title={report.reportTitle}
                      className="w-full h-[480px] sm:h-[540px] bg-white"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Acciones principales: Ver PDF y Descargar PDF */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-cirqa-negro/10">
                <span className="text-[11px] text-cirqa-negro/60 font-light text-center sm:text-left">
                  Certificado oficial emitido bajo normas internacionales ISO 12312 y ANSI Z80.3.
                </span>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Ver PDF en nueva pestaña */}
                  <a
                    href={report.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial border border-cirqa-negro/20 hover:border-cirqa-negro text-cirqa-negro text-xs font-medium px-5 py-3 rounded-full hover:bg-cirqa-surface active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver PDF Oficial</span>
                    <ExternalLink className="w-3 h-3 text-cirqa-negro/50" />
                  </a>

                  {/* Descargar PDF Oficial */}
                  <a
                    href={report.pdfUrl}
                    download={report.pdfFilename}
                    className="flex-1 sm:flex-initial bg-cirqa-negro hover:bg-cirqa-primario text-white text-xs font-semibold px-6 py-3 rounded-full active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </a>
                </div>
              </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
