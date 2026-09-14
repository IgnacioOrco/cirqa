import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, AlertTriangle, ShieldCheck, Check, RotateCw, Eye } from 'lucide-react';
import { MODELS } from '../data/models';
import { FILTERS } from '../data/filters';
import { getProductImage } from '../data/productImages';

export default function ConfiguratorModal({
  isOpen,
  onClose,
  initialModel = null,
  initialFilter = null,
  onOpenPrescription,
}) {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[1]); // Default Día (84%)
  const [activeAngle, setActiveAngle] = useState('frente'); // 'frente' | 'perspectiva' | 'cenital'

  useEffect(() => {
    if (initialModel) {
      setSelectedModel(initialModel);
    }
  }, [initialModel]);

  useEffect(() => {
    if (initialFilter) {
      setSelectedFilter(initialFilter);
    }
  }, [initialFilter]);

  // Direct checkout action via WhatsApp
  const handleDirectBuy = () => {
    const modelName = selectedModel?.name || 'Modelo Q1';
    const filterName = selectedFilter?.name || 'Día';
    const price = selectedModel?.formattedPrice || '$ 42.000';
    const message = encodeURIComponent(
      `Hola CIRQA. Quiero comprar mi ${modelName} con cristal ${filterName} (${price}). ¿Cómo procedemos con el pago y envío asegurado?`
    );
    window.open(`https://wa.me/5491155891782?text=${message}`, '_blank');
  };

  const currentPhoto = getProductImage(selectedModel.id, selectedFilter.id, activeAngle);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-10">
          
          {/* Backdrop with delicate blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-cirqa-negro/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-3xl border border-cirqa-negro/10 shadow-2xl overflow-hidden z-10 my-auto"
          >
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-cirqa-negro/10 flex items-center justify-between bg-cirqa-surface flex-shrink-0">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-cirqa-primario font-semibold block">
                  Configurador de Lentes · Fotografía de Estudio
                </span>
                <h3 className="text-xl sm:text-2xl font-light text-cirqa-negro tracking-tight mt-0.5">
                  Personalizá tu {selectedModel.name}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-cirqa-negro/60 hover:text-cirqa-negro rounded-full hover:bg-black/5 transition-colors focus:outline-none"
                aria-label="Cerrar configurador"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 lg:p-10 items-center overflow-y-auto">
              
              {/* Left Column: Real Product Photography Stage */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center bg-gradient-to-b from-[#FBFBFA] to-[#F3F1ED] rounded-3xl p-6 sm:p-8 border border-cirqa-negro/10 relative shadow-inner">
                
                {/* Angle Controls floating top pill */}
                <div className="flex items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-full border border-cirqa-negro/10 shadow-sm z-20 mb-4">
                  {[
                    { id: 'frente', label: 'Frente' },
                    { id: 'perspectiva', label: '3/4 Lateral' },
                    { id: 'cenital', label: 'Detalle' },
                  ].map((ang) => (
                    <button
                      key={ang.id}
                      onClick={() => setActiveAngle(ang.id)}
                      className={`px-3 py-1 text-[11px] font-medium rounded-full transition-all ${
                        activeAngle === ang.id
                          ? 'bg-cirqa-negro text-white shadow-xs font-semibold'
                          : 'text-cirqa-negro/70 hover:text-cirqa-negro hover:bg-black/5'
                      }`}
                    >
                      {ang.label}
                    </button>
                  ))}
                </div>

                {/* Ambient glow behind glasses */}
                <div
                  className="absolute w-56 h-56 rounded-full blur-3xl opacity-20 transition-colors duration-500 pointer-events-none"
                  style={{ backgroundColor: selectedFilter.hexCode }}
                />

                {/* Real Product Image with cross-fade */}
                <div className="w-full max-w-md h-52 sm:h-64 flex items-center justify-center relative z-10 p-2">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${selectedModel.id}-${selectedFilter.id}-${activeAngle}`}
                      src={currentPhoto}
                      alt={`${selectedModel.name} con filtro ${selectedFilter.name}`}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="w-full h-full object-contain select-none filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  </AnimatePresence>
                </div>

                {/* Dimensions & Craft badge */}
                <div className="mt-4 pt-4 border-t border-cirqa-negro/10 w-full flex items-center justify-between text-[11px] text-cirqa-negro/70 font-normal">
                  <span>Lente: {selectedModel.lensWidth}mm</span>
                  <span>Puente: {selectedModel.bridgeWidth}mm</span>
                  <span>Patilla: {selectedModel.templeLength}mm</span>
                  <span className="font-semibold text-cirqa-negro">{selectedModel.frameShape}</span>
                </div>
              </div>

              {/* Right Column: Customization Controls */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* 1. Model Selector Tabs */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cirqa-negro/70 block mb-2">
                    1. Seleccionar Armazón
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model)}
                        className={`py-2.5 px-1 text-center rounded-2xl border transition-all text-xs ${
                          selectedModel.id === model.id
                            ? 'border-cirqa-negro bg-cirqa-negro text-white font-semibold shadow-sm'
                            : 'border-cirqa-negro/15 bg-white text-cirqa-negro hover:border-cirqa-negro/40'
                        }`}
                      >
                        <span className="block text-[10px] opacity-75">{model.code}</span>
                        <span className="block font-medium">{model.name.replace('Modelo ', '')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Lens Filter Selector */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cirqa-negro/70 block mb-2">
                    2. Seleccionar Cristal Circadiano
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {FILTERS.map((filter) => {
                      const isSelected = selectedFilter.id === filter.id;
                      return (
                        <button
                          key={filter.id}
                          onClick={() => setSelectedFilter(filter)}
                          className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'border-cirqa-primario bg-cirqa-primario/5 shadow-sm ring-1 ring-cirqa-primario/20'
                              : 'border-cirqa-negro/15 bg-white hover:border-cirqa-negro/30'
                          }`}
                        >
                          <div
                            className="w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0 border"
                            style={{ backgroundColor: filter.hexCode, borderColor: `${filter.hexCode}88` }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-cirqa-negro">
                                {filter.name}
                              </span>
                              <span className="text-[10px] font-bold text-cirqa-primario">
                                {filter.tag}
                              </span>
                            </div>
                            <span className="text-[10px] text-cirqa-negro/60 block mt-0.5">
                              {filter.usage}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optical Specs & Night warning */}
                <div className="p-4 bg-cirqa-surface rounded-2xl border border-cirqa-negro/10 text-xs">
                  <div className="flex items-center justify-between text-cirqa-negro/80 font-normal">
                    <span>Transmitancia (VLT): <strong>{selectedFilter.vlt}</strong></span>
                    <span>Protección: <strong>100% UV400</strong></span>
                  </div>
                  {selectedFilter.id === 'noche' && (
                    <div className="mt-2 pt-2 border-t border-cirqa-negro/10 flex items-center gap-1.5 text-cirqa-carmin text-[11px] font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>No apto para conducir ($T_v &lt; 15\%$) · Uso nocturno para descanso</span>
                    </div>
                  )}
                </div>

                {/* Action Button: Pill CTA - Modo Próximamente */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled
                    className="w-full bg-cirqa-negro/20 text-cirqa-negro/50 cursor-not-allowed shadow-none text-xs font-bold tracking-widest uppercase py-4 rounded-full flex items-center justify-center gap-2"
                    aria-disabled="true"
                  >
                    <span>PRÓXIMAMENTE DISPONIBLE</span>
                  </button>
                </div>

              </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
