import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Eye,
  ExternalLink,
  FileText,
  SlidersHorizontal,
  Award,
} from 'lucide-react';
import { FILTERS } from '../data/filters';

export default function ClinicalTrialsModal({ isOpen, onClose, initialFilterId = 'dia' }) {
  const [activeFilterId, setActiveFilterId] = useState(initialFilterId);
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'tech'

  // Al abrir el modal o recibir un nuevo filtro inicial, sincronizar y poner la pestaña en 'pdf'
  useEffect(() => {
    if (initialFilterId) {
      setActiveFilterId(initialFilterId);
    }
    if (isOpen) {
      setActiveTab('pdf');
    }
  }, [initialFilterId, isOpen]);

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
      colorLimits: 'D65 Neutro: Alta fidelidad cromática',
      pdfUrl: '/certificates/CIRQA-Certificado-Filtro-Dia.pdf',
      pdfFilename: 'CIRQA-Certificado-Filtro-Clear.pdf',
      reportTitle: 'Certificación Homologada Internacional ISO 12312-1',
      description: 'Lente de alta claridad óptica con protección UV400 completa y filtrado balanceado de luz azul (26%) para trabajo de pantalla prolongado.',
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
      description: 'Ensayo espectrométrico completo que certifica un 84% de bloqueo de luz azul de alta energía, manteniendo un 76.17% de transmitancia luminosa natural.',
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
      description: 'Test de absorción óptica que comprueba más del 95% de corte en longitud de onda azul crítica para horas de atardecer y sobreexposición a pantallas.',
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
      description: 'Certificado de laboratorio que acredita el bloqueo total (99%) de la banda azul supresora de melatonina bajo estándar internacional ISO 12312-1:2022.',
    },
  };

  const report = labData[activeFilterId] || labData.dia;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop con desenfoque de alta definición */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Card Principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-white border border-cirqa-negro/10 rounded-3xl shadow-2xl overflow-hidden z-10 p-5 sm:p-7"
          >
            {/* Header del Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-cirqa-negro/10 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cirqa-primario/10 text-cirqa-primario text-[10px] uppercase font-bold tracking-widest font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    CERTIFICACIÓN DE LABORATORIO & ESPECTROMETRÍA
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-light text-cirqa-negro tracking-tight mt-1.5">
                  Reportes de Ensayo Clínico Oficiales
                </h3>
                <p className="text-xs text-cirqa-negro/60 font-light mt-0.5 hidden sm:block">
                  Homologados bajo normas internacionales ISO 12312-1, ANSI Z80.3 y AS/NZS 1067.
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 text-cirqa-negro/50 hover:text-cirqa-negro rounded-full hover:bg-cirqa-surface transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="overflow-y-auto pr-1 mt-4 space-y-4 flex-grow">
              
              {/* Barra de Filtros (Selector de Cristal) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {FILTERS.map((f) => {
                    const isSelected = activeFilterId === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setActiveFilterId(f.id)}
                        className={`px-4 py-2 text-xs rounded-full transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-cirqa-negro text-white font-semibold shadow-md'
                            : 'bg-cirqa-surface text-cirqa-negro/80 hover:bg-cirqa-negro/10 font-normal'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/10"
                          style={{ backgroundColor: f.hexCode }}
                        />
                        <span>Filtro {f.name}</span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-white/70' : 'text-cirqa-negro/40'}`}>
                          ({f.bullets[0].value})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selector de Pestaña: Documento Oficial vs Ficha Técnica */}
                <div className="inline-flex p-1 bg-cirqa-surface rounded-full border border-cirqa-negro/10 self-start sm:self-auto flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('pdf')}
                    className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'pdf'
                        ? 'bg-white text-cirqa-negro font-semibold shadow-xs'
                        : 'text-cirqa-negro/60 hover:text-cirqa-negro font-normal'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-cirqa-primario" />
                    <span>Documento Oficial (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tech')}
                    className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'tech'
                        ? 'bg-white text-cirqa-negro font-semibold shadow-xs'
                        : 'text-cirqa-negro/60 hover:text-cirqa-negro font-normal'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-cirqa-negro/70" />
                    <span>Métricas de Ensayo</span>
                  </button>
                </div>
              </div>

              {/* VISTA 1: Visor del Documento Oficial (PDF) */}
              {activeTab === 'pdf' && (
                <div className="space-y-3">
                  {/* Barra de control superior del PDF */}
                  <div className="bg-[#1C140F] text-white px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-medium text-white block text-xs truncate">
                          {report.reportTitle}
                        </span>
                        <span className="text-[10px] text-white/50 block font-mono">
                          {report.standard}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={report.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Abrir en pestaña nueva a pantalla completa"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                        <span>Pantalla Completa</span>
                      </a>
                      <a
                        href={report.pdfUrl}
                        download={report.pdfFilename}
                        className="px-3.5 py-1.5 rounded-full bg-cirqa-primario hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title="Descargar archivo PDF oficial"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar PDF</span>
                      </a>
                    </div>
                  </div>

                  {/* Contenedor del Visor Embebido con doble fallback resiliente */}
                  <div className="w-full h-[520px] sm:h-[600px] rounded-2xl bg-neutral-100 border border-cirqa-negro/15 overflow-hidden shadow-inner relative">
                    <object
                      data={`${report.pdfUrl}#toolbar=1&navpanes=0`}
                      type="application/pdf"
                      className="w-full h-full"
                    >
                      <iframe
                        src={`${report.pdfUrl}#toolbar=1&navpanes=0`}
                        title={report.reportTitle}
                        className="w-full h-full border-0"
                      >
                        {/* Fallback en caso de que el navegador móvil bloquee embebidos */}
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                          <FileText className="w-12 h-12 text-cirqa-primario mb-3" />
                          <h4 className="text-base font-semibold text-cirqa-negro">
                            Visualización de Certificado de Laboratorio
                          </h4>
                          <p className="text-xs text-cirqa-negro/70 max-w-md mt-1 mb-5">
                            Tu navegador requiere abrir los documentos PDF en una pestaña dedicada o descargarlos para su lectura.
                          </p>
                          <div className="flex items-center gap-3">
                            <a
                              href={report.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-5 py-2.5 rounded-full bg-cirqa-negro hover:bg-cirqa-primario text-white text-xs font-semibold flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Abrir Documento Oficial</span>
                            </a>
                            <a
                              href={report.pdfUrl}
                              download={report.pdfFilename}
                              className="px-5 py-2.5 rounded-full border border-cirqa-negro/20 text-cirqa-negro text-xs font-semibold hover:bg-cirqa-surface flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              <span>Descargar PDF</span>
                            </a>
                          </div>
                        </div>
                      </iframe>
                    </object>
                  </div>

                  {/* Aviso informativo inferior */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-cirqa-negro/60 gap-2 px-1">
                    <span>
                      {report.description}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tech')}
                      className="text-cirqa-primario hover:underline font-semibold self-start sm:self-auto cursor-pointer"
                    >
                      Ver desglose de métricas técnicas &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* VISTA 2: Ficha Técnica y Métricas de Laboratorio */}
              {activeTab === 'tech' && (
                <div className="space-y-4">
                  <div className="bg-cirqa-surface rounded-2xl p-6 border border-cirqa-negro/10 text-xs space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-cirqa-negro/10">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium">
                          Normas Internacionales Homologadas
                        </span>
                        <span className="font-semibold text-cirqa-negro text-sm">
                          {report.standard}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium">
                          Clasificación & Categoría de Filtro
                        </span>
                        <span className="font-semibold text-cirqa-negro text-sm">
                          {report.category}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-cirqa-negro/10">
                      <div className="bg-white p-3 rounded-xl border border-cirqa-negro/5">
                        <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium">
                          Transmitancia ($T_v$)
                        </span>
                        <span className="font-bold text-cirqa-negro text-sm sm:text-base mt-0.5 block">
                          {report.tv}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-cirqa-negro/5">
                        <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium">
                          Espectro Azul ($T_{sb}$)
                        </span>
                        <span className="font-bold text-cirqa-negro text-sm sm:text-base mt-0.5 block">
                          {report.tsb}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-cirqa-negro/5">
                        <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium">
                          Filtro UVB (280-315nm)
                        </span>
                        <span className="font-bold text-emerald-700 text-sm sm:text-base mt-0.5 block">
                          {report.uvb}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-cirqa-negro/5">
                        <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium">
                          Filtro UVA (315-380nm)
                        </span>
                        <span className="font-bold text-emerald-700 text-sm sm:text-base mt-0.5 block">
                          {report.uva}
                        </span>
                      </div>
                    </div>

                    {/* Colorimetría y límites de color */}
                    {report.colorLimits && (
                      <div className="pb-3 border-b border-cirqa-negro/10">
                        <span className="text-[10px] uppercase tracking-wider text-cirqa-negro/50 block font-medium mb-1">
                          Coordenadas Espectrofotométricas CIE / Color Limits
                        </span>
                        <span className="font-mono text-xs text-cirqa-negro/80 bg-white px-3 py-1.5 rounded-lg border border-cirqa-negro/10 inline-block">
                          {report.colorLimits}
                        </span>
                      </div>
                    )}

                    {/* Indicador de Aptitud para Conducción */}
                    <div
                      className={`p-4 rounded-2xl flex items-center gap-3 ${
                        report.isDrivingPass
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-cirqa-carmin/10 text-cirqa-carmin border border-cirqa-carmin/30'
                      }`}
                    >
                      {report.isDrivingPass ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-cirqa-carmin flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-xs uppercase tracking-wide block">
                          {report.isDrivingPass ? 'Aptitud Vial Certificada' : 'Restricción de Conducción Vial'}
                        </span>
                        <span className="text-xs font-normal">
                          {report.driving}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('pdf')}
                      className="inline-flex items-center gap-2 bg-cirqa-negro text-white px-6 py-3 rounded-full text-xs font-semibold hover:bg-cirqa-primario transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Ver Documento Escaneado Original (PDF)</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Footer del Modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-cirqa-negro/10 flex-shrink-0">
              <span className="text-[11px] text-cirqa-negro/60 font-light text-center sm:text-left">
                Certificados oficiales emitidos y firmados digitalmente bajo normas ISO 12312 y ANSI Z80.3.
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <a
                  href={report.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial border border-cirqa-negro/20 hover:border-cirqa-negro text-cirqa-negro text-xs font-medium px-5 py-2.5 rounded-full hover:bg-cirqa-surface active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver en pestaña nueva</span>
                  <ExternalLink className="w-3 h-3 text-cirqa-negro/50" />
                </a>

                <a
                  href={report.pdfUrl}
                  download={report.pdfFilename}
                  className="flex-1 sm:flex-initial bg-cirqa-negro hover:bg-cirqa-primario text-white text-xs font-semibold px-6 py-2.5 rounded-full active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </a>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
