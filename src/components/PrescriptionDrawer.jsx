import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, MessageCircle, FileText, CheckCircle2 } from 'lucide-react';
import { MODELS } from '../data/models';
import { FILTERS } from '../data/filters';

export default function PrescriptionDrawer({ isOpen, onClose, selectedModel, selectedFilter }) {
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [customModel, setCustomModel] = useState(selectedModel || MODELS[0]);
  const [customFilter, setCustomFilter] = useState(selectedFilter || FILTERS[1]);

  React.useEffect(() => {
    if (selectedModel) setCustomModel(selectedModel);
    if (selectedFilter) setCustomFilter(selectedFilter);
  }, [selectedModel, selectedFilter]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPrescriptionFile(e.dataTransfer.files[0]);
    }
  };

  // Pre-formatted WhatsApp message
  const handleWhatsAppRedirect = () => {
    const modelName = customModel?.name || 'Modelo Q1';
    const filterName = customFilter?.name || 'Día (84%)';
    
    const message = encodeURIComponent(
      `Hola CIRQA. Quiero encargar mi ${modelName} con cristal ${filterName} con mi receta oftalmológica.\n${prescriptionFile ? `Archivo adjunto: ${prescriptionFile.name}\n` : ''}${notes ? `Aclaraciones: ${notes}` : ''}`
    );

    const whatsappNumber = '5491155891782'; // Brand Book official contact phone
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          
          {/* Backdrop with delicate blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-cirqa-negro/40 backdrop-blur-md"
          />

          {/* Side Drawer Panel with Apple soft glassmorphism & rounded inner styling */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl border-l border-cirqa-negro/10 shadow-2xl h-full flex flex-col justify-between p-6 sm:p-8 overflow-y-auto z-10 sm:rounded-l-3xl"
          >
            {/* Header & Body */}
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-cirqa-negro/10">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-cirqa-primario font-semibold block">
                    Validación Médica & Óptica
                  </span>
                  <h3 className="text-2xl font-light text-cirqa-negro tracking-tight mt-0.5">
                    Tengo mi Receta
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-cirqa-negro/50 hover:text-cirqa-negro rounded-full hover:bg-cirqa-surface transition-colors"
                  aria-label="Cerrar panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selected frame & filter summary */}
              <div className="my-6 p-4 bg-cirqa-surface rounded-2xl border border-cirqa-negro/5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-cirqa-negro block">{customModel?.name}</span>
                  <span className="text-cirqa-negro/60 font-light">Cristal {customFilter?.name}</span>
                </div>
                {/* <span className="text-cirqa-negro font-medium">{customModel?.formattedPrice}</span> */}
                <span className="text-[10px] uppercase font-semibold tracking-wider text-cirqa-primario">
                  Pre-lanzamiento
                </span>
              </div>

              {/* Dropzone: Adjuntar Receta Oftalmológica */}
              <div className="space-y-3 mb-6">
                <label className="text-xs font-semibold text-cirqa-negro block">
                  Adjuntar Receta Oftalmológica
                </label>
                
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-2xl p-6 text-center transition-all ${
                    dragActive
                      ? 'border-cirqa-primario bg-cirqa-primario/5 ring-2 ring-cirqa-primario/20'
                      : 'border-cirqa-negro/20 bg-cirqa-surface hover:border-cirqa-negro/40'
                  }`}
                >
                  <input
                    type="file"
                    id="prescription-file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {prescriptionFile ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-cirqa-negro">
                      <FileText className="w-4 h-4 text-cirqa-primario" />
                      <span className="font-medium truncate max-w-[200px]">{prescriptionFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setPrescriptionFile(null)}
                        className="text-cirqa-carmin hover:underline text-[11px] ml-2"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="prescription-file" className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-cirqa-negro/5 flex items-center justify-center text-cirqa-negro/60">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-cirqa-negro font-light">
                        Arrastrá tu receta médica o <span className="underline font-medium text-cirqa-negro">examinar</span>
                      </span>
                      <span className="text-[10px] text-cirqa-negro/40">
                        Formatos soportados: JPG, PNG, PDF (hasta 10MB)
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Area de Texto para Aclaraciones */}
              <div className="space-y-2 mb-6">
                <label className="text-xs font-semibold text-cirqa-negro block">
                  Aclaraciones o Comentarios (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Ej: Tengo astigmatismo de -0.75 en ojo derecho, distancia pupilar 63mm..."
                  className="w-full text-xs p-3.5 rounded-2xl border border-cirqa-negro/15 bg-white focus:outline-none focus:border-cirqa-negro font-light leading-relaxed resize-none transition-colors"
                />
              </div>
            </div>

            {/* Footer Actions: Botón TENGO MI RECETA -> WhatsApp */}
            <div className="pt-6 border-t border-cirqa-negro/10 space-y-3">
              <button
                type="button"
                onClick={handleWhatsAppRedirect}
                className="w-full bg-[#25D366] text-white text-xs font-bold tracking-widest uppercase py-4 rounded-full hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>TENGO MI RECETA</span>
              </button>
              
              <p className="text-[10px] text-center text-cirqa-negro/50 font-light">
                Un especialista óptico de CIRQA validará tu receta y te asistirá en el calibrado.
              </p>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
