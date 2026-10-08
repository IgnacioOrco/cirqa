import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Laptop,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Glasses,
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { FILTERS } from '../data/filters';
import { formatMediaUrl } from '../services/api';

const QUESTIONS = [
  {
    id: 'screenTime',
    step: 1,
    title: '¿Cuántas horas al día estás frente a pantallas?',
    subtitle: 'Calcula monitores, smartphones y televisores con luz LED artificial.',
    options: [
      {
        value: 'light',
        label: 'Menos de 4 horas',
        desc: 'Uso ligero o moderado, navegación casual y lecturas cortas.',
        badge: 'Exposición Baja',
        icon: Sun,
      },
      {
        value: 'moderate',
        label: '4 a 8 horas',
        desc: 'Jornada laboral típica de oficina, estudio intensivo o tareas continuas.',
        badge: 'Exposición Media',
        icon: Laptop,
      },
      {
        value: 'heavy',
        label: 'Más de 8 horas y noche',
        desc: 'Pantallas hasta altas horas de la noche, turnos nocturnos o gaming.',
        badge: 'Exposición Crítica',
        icon: Moon,
      },
    ],
  },
  {
    id: 'goal',
    step: 2,
    title: '¿Cuál es tu objetivo circadiano principal?',
    subtitle: 'Elige el beneficio que más transformaría tu rendimiento y descanso.',
    options: [
      {
        value: 'focus',
        label: 'Enfoque y productividad diaria',
        desc: 'Aumentar contraste, eliminar jaquecas y fatiga visual durante el día.',
        badge: 'Foco & Claridad',
        icon: Laptop,
      },
      {
        value: 'sleep',
        label: 'Conciliar el sueño y descansar',
        desc: 'Facilitar la secreción de melatonina y lograr un sueño profundo sin despertares.',
        badge: 'Melatonina & Sueño',
        icon: Moon,
      },
      {
        value: 'protection',
        label: 'Protección general preventiva',
        desc: 'Cuidar la retina a largo plazo manteniendo colores neutros y naturales.',
        badge: 'Prevención Diaria',
        icon: ShieldCheck,
      },
    ],
  },
  {
    id: 'style',
    step: 3,
    title: '¿Qué estilo de armazón preferís?',
    subtitle: 'Diseño geométrico elaborado en acetato orgánico aeroespacial.',
    options: [
      {
        value: 'classic',
        label: 'Clásico / Redondeado',
        desc: 'Silueta atemporal y equilibrada. Ideal para rostros cuadrados u ovalados.',
        badge: 'Atemporal',
        codeHint: 'Q-001 / Q-002',
      },
      {
        value: 'modern',
        label: 'Moderno / Estructurado',
        desc: 'Líneas arquitectónicas y presencia marcada. Carácter y definición visual.',
        badge: 'Estructurado',
        codeHint: 'Q-003 / Q-004',
      },
      {
        value: 'minimal',
        label: 'Minimalista / Sutil',
        desc: 'Perfil liviano, máxima ligereza y elegancia sin distracciones.',
        badge: 'Ultraligero',
        codeHint: 'Q-005',
      },
    ],
  },
];

export default function CircadianQuizModal({
  isOpen,
  onClose,
  onSelectRecommendation,
}) {
  const { products } = useProducts({ all: false });

  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    screenTime: '',
    goal: '',
    style: '',
  });

  const handleSelectOption = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCurrentStep(4); // Pantalla de resultado
    }
  };

  const handleReset = () => {
    setAnswers({
      screenTime: '',
      goal: '',
      style: '',
    });
    setCurrentStep(1);
  };

  // Calcular recomendación basada en respuestas y catálogo activo
  const recommendation = useMemo(() => {
    if (currentStep !== 4) return null;

    // 1. Determinar variante recomendada
    let targetVariantKey = 'dia';
    let circadianProfileTitle = 'Perfil Diurno · Enfoque Biológico';
    let circadianExplanation =
      'Filtrado óptimo del 84% de luz azul artificial diurna (400-455nm), eliminando fatiga ocular y preservando el contraste sin distorsión de color.';

    if (answers.goal === 'sleep' || answers.screenTime === 'heavy') {
      targetVariantKey = 'noche';
      circadianProfileTitle = 'Perfil Nocturno · Síntesis de Melatonina';
      circadianExplanation =
        'Bloqueo espectral absoluto del 99% en el rango crítico nocturno (450-550nm). Protege la glándula pineal para inducir el sueño profundo 2 horas antes de acostarse.';
    } else if (answers.screenTime === 'moderate' && answers.goal === 'focus') {
      targetVariantKey = 'dia';
      circadianProfileTitle = 'Perfil Rendimiento · Pantallas & Oficina';
      circadianExplanation =
        'Diseñado para quienes pasan su jornada frente al monitor. Elimina el microparpadeo de LEDs y previene cefaleas tensionales durante el día.';
    } else if (answers.goal === 'protection' || answers.screenTime === 'light') {
      targetVariantKey = 'clear';
      circadianProfileTitle = 'Perfil Urbano · Protección Preventiva';
      circadianExplanation =
        'Cristal transparente con tratamiento antirreflejo multicapa y filtro selectivo del 40% de radiación azul para uso cotidiano ininterrumpido.';
    }

    // Si la exposición es alta pero el objetivo es foco:
    if (answers.screenTime === 'heavy' && answers.goal === 'focus') {
      targetVariantKey = 'transicion';
      circadianProfileTitle = 'Perfil Crepuscular · Jornada Extendida';
      circadianExplanation =
        'Tinte ámbar circadiano al 90% diseñado para la caída solar (a partir de las 17hs), permitiendo mantener la concentración laboral sin destruir el descanso nocturno.';
    }

    // 2. Determinar producto recomendado del catálogo
    let matchedProduct = null;
    if (products.length > 0) {
      if (answers.style === 'classic') {
        matchedProduct =
          products.find(
            (p) =>
              p.frameShape?.toLowerCase().includes('redond') ||
              p.modelCode?.includes('001') ||
              p.modelCode?.includes('002')
          ) || products[0];
      } else if (answers.style === 'modern') {
        matchedProduct =
          products.find(
            (p) =>
              p.frameShape?.toLowerCase().includes('rectang') ||
              p.frameShape?.toLowerCase().includes('cuadrad') ||
              p.modelCode?.includes('003') ||
              p.modelCode?.includes('004')
          ) || products[0];
      } else if (answers.style === 'minimal') {
        matchedProduct =
          products.find(
            (p) =>
              p.frameShape?.toLowerCase().includes('geom') ||
              p.modelCode?.includes('005')
          ) || products[products.length - 1] || products[0];
      }
    }

    const finalProduct = matchedProduct || products[0] || null;

    // Buscar la variante específica dentro del producto si existe
    let matchedVariant = null;
    if (finalProduct && Array.isArray(finalProduct.variants) && finalProduct.variants.length > 0) {
      matchedVariant =
        finalProduct.variants.find((v) => v.key === targetVariantKey) ||
        finalProduct.variants.find((v) => v.key.includes(targetVariantKey)) ||
        finalProduct.variants[0];
    }

    // Metadata del filtro CIRQA
    const filterMeta = FILTERS.find((f) => f.id === targetVariantKey) || FILTERS[1];

    return {
      product: finalProduct,
      variantKey: targetVariantKey,
      variant: matchedVariant,
      filterMeta,
      title: circadianProfileTitle,
      explanation: circadianExplanation,
    };
  }, [currentStep, answers, products]);

  const handleApplyRecommendation = () => {
    if (!recommendation?.product) return;
    onClose();
    if (onSelectRecommendation) {
      onSelectRecommendation(recommendation.product, recommendation.variantKey);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop suave */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-cirqa-negro/70 backdrop-blur-md"
        />

        {/* Contenedor Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl border border-cirqa-negro/10 shadow-2xl overflow-hidden z-10 my-auto text-cirqa-negro font-montserrat"
        >
          {/* Header */}
          <div className="px-6 sm:px-8 py-5 border-b border-cirqa-negro/10 flex items-center justify-between bg-cirqa-surface/80 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cirqa-negro text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cirqa-primario" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-cirqa-primario font-semibold block">
                  CIRQA · Test Circadiano
                </span>
                <h2 className="text-base sm:text-lg font-light tracking-tight text-cirqa-negro">
                  Descubrí tu Rutina Óptica
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-cirqa-negro/50 hover:text-cirqa-negro rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Cerrar test"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Progreso (Pasos 1 a 3) */}
          {currentStep <= 3 && (
            <div className="w-full bg-cirqa-negro/5 h-1">
              <motion.div
                className="bg-cirqa-primario h-1"
                initial={false}
                animate={{ width: `${(currentStep / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Cuerpo del Test */}
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {currentStep <= 3 ? (
                // PREGUNTAS
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div>
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cirqa-negro/40 block mb-1">
                      Paso {currentStep} de 3
                    </span>
                    <h3 className="text-xl sm:text-2xl font-light tracking-tight text-cirqa-negro">
                      {QUESTIONS[currentStep - 1].title}
                    </h3>
                    <p className="text-xs sm:text-sm text-cirqa-negro/60 font-light mt-1">
                      {QUESTIONS[currentStep - 1].subtitle}
                    </p>
                  </div>

                  {/* Opciones */}
                  <div className="grid grid-cols-1 gap-3">
                    {QUESTIONS[currentStep - 1].options.map((opt) => {
                      const isSelected =
                        answers[QUESTIONS[currentStep - 1].id] === opt.value;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            handleSelectOption(QUESTIONS[currentStep - 1].id, opt.value)
                          }
                          className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-4 group cursor-pointer ${
                            isSelected
                              ? 'border-cirqa-primario bg-cirqa-arena/20 shadow-sm'
                              : 'border-cirqa-negro/10 bg-[#FBFBFA] hover:bg-white hover:border-cirqa-negro/25 hover:shadow-xs'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-cirqa-primario text-white'
                                : 'bg-white border border-cirqa-negro/10 text-cirqa-negro/60 group-hover:border-cirqa-primario/40'
                            }`}
                          >
                            {opt.icon ? (
                              <opt.icon className="w-4 h-4" />
                            ) : (
                              <Glasses className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-cirqa-negro">
                                {opt.label}
                              </span>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-cirqa-primario font-semibold bg-cirqa-primario/10 px-2 py-0.5 rounded-full">
                                {opt.badge}
                              </span>
                            </div>
                            <p className="text-xs text-cirqa-negro/60 font-light leading-relaxed">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navegación anterior */}
                  {currentStep > 1 && (
                    <div className="pt-2 flex items-center justify-start">
                      <button
                        type="button"
                        onClick={() => setCurrentStep((prev) => prev - 1)}
                        className="inline-flex items-center gap-1.5 text-xs text-cirqa-negro/50 hover:text-cirqa-negro transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver a la pregunta anterior</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                // RESULTADO / RECOMENDACIÓN
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Diagnóstico Completado
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-cirqa-negro pt-2">
                      {recommendation?.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-cirqa-negro/60 font-light max-w-lg mx-auto">
                      {recommendation?.explanation}
                    </p>
                  </div>

                  {/* Tarjeta del producto recomendado */}
                  {recommendation?.product && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10 flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-40 h-28 sm:w-44 sm:h-32 rounded-xl bg-white border border-cirqa-negro/5 p-2 flex items-center justify-center flex-shrink-0 shadow-xs">
                        <img
                          src={formatMediaUrl(
                            recommendation.product.previewImage ||
                              recommendation.product.image_url ||
                              recommendation.product.primaryImage
                          )}
                          alt={recommendation.product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className="text-[11px] font-mono uppercase font-bold text-cirqa-primario">
                            {recommendation.product.modelCode || 'Q-001'}
                          </span>
                          <span className="text-[11px] text-cirqa-negro/40">•</span>
                          <span className="text-xs text-cirqa-negro/70 font-medium">
                            {recommendation.product.name}
                          </span>
                        </div>

                        {/* Badge de la variante recomendada */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-cirqa-negro/10 shadow-xs">
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                            style={{
                              backgroundColor:
                                recommendation.variant?.badgeColor ||
                                recommendation.filterMeta?.hexCode ||
                                '#F3B93A',
                            }}
                          />
                          <span className="text-xs font-bold text-cirqa-negro tracking-wide">
                            {recommendation.variant?.name || recommendation.filterMeta?.name}
                          </span>
                          <span className="text-[10px] text-cirqa-negro/50 font-mono">
                            {recommendation.variant?.subtitle || recommendation.filterMeta?.tag}
                          </span>
                        </div>

                        <p className="text-xs text-cirqa-negro/60 font-light leading-relaxed">
                          Armazón bio-diseñado para máximo confort periférico. Compatible con graduación óptica certificada.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl border border-cirqa-negro/15 text-xs text-cirqa-negro/70 hover:text-cirqa-negro hover:bg-black/5 transition-colors flex items-center justify-center gap-2 cursor-pointer font-medium"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Repetir test</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyRecommendation}
                      className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-cirqa-negro hover:bg-black text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 shadow-lg shadow-black/15 transition-all cursor-pointer group"
                    >
                      <span>Ver mi lente recomendado</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
