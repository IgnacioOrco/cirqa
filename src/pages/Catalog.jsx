import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, Filter, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PhilosophyAndFooter from '../components/PhilosophyAndFooter';
import ConfiguratorModal from '../components/ConfiguratorModal';
import PrescriptionDrawer from '../components/PrescriptionDrawer';
import CircadianQuizModal from '../components/CircadianQuizModal';
import ClinicalTrialsModal from '../components/ClinicalTrialsModal';
import { useProducts, ProductCardSkeleton } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import { FILTERS } from '../data/filters';
import { formatMediaUrl } from '../services/api';
import { resolveProductCardImage, getPrimaryProductImage, getHoverProductImage, getImagesForVariant, matchVariantKey } from '../utils/productImages';

const CIRCADIAN_FILTER_TABS = [
  { id: 'ALL', label: 'Todos', color: '#111111' },
  { id: 'clear', label: 'Clear', color: '#CBD5E1' },
  { id: 'dia', label: 'Día', color: '#FACC15' },
  { id: 'transicion', label: 'Transición', color: '#FB923C' },
  { id: 'noche', label: 'Noche', color: '#F87171' },
];

export default function Catalog() {
  const { products, loading, error, refetch } = useProducts({ all: false });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterTab, setSelectedFilterTab] = useState('ALL');

  // Configurator Modal state
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [activeModel, setActiveModel] = useState(null);
  const [activeVariantKey, setActiveVariantKey] = useState(null);

  // Circadian Quiz state
  const [quizOpen, setQuizOpen] = useState(false);

  // Clinical Trials Modal state
  const [trialsOpen, setTrialsOpen] = useState(false);
  const [activeTrialFilterId, setActiveTrialFilterId] = useState('dia');

  const handleOpenTrials = (filterId = 'dia') => {
    setActiveTrialFilterId(filterId || 'dia');
    setTrialsOpen(true);
  };

  // Prescription Drawer state
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [activePrescriptionModel, setActivePrescriptionModel] = useState(null);

  // Per-card hover & variant selection
  const [cardHoveredId, setCardHoveredId] = useState(null);
  const [cardSelectedVariant, setCardSelectedVariant] = useState({});

  const handleOpenConfigurator = (model, variantKey = null) => {
    setActiveModel(model);
    setActiveVariantKey(variantKey || (selectedFilterTab !== 'ALL' ? selectedFilterTab : cardSelectedVariant[model.id]) || null);
    setConfiguratorOpen(true);
  };

  const handleQuizRecommendation = (recommendedProduct, recommendedVariantKey) => {
    setActiveModel(recommendedProduct);
    setActiveVariantKey(recommendedVariantKey);
    setConfiguratorOpen(true);
  };

  const handleOpenPrescription = (model = null) => {
    setActivePrescriptionModel(model);
    setPrescriptionOpen(true);
  };

  // Filtrado reactivo de productos (únicamente por Cristal Circadiano y búsqueda)
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name?.toLowerCase().includes(query) ||
      p.modelCode?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query);

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white text-cirqa-negro font-montserrat flex flex-col selection:bg-cirqa-arena selection:text-cirqa-negro">
      <Navbar onOpenQuiz={() => setQuizOpen(true)} />

      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6">

          {/* Header del Catálogo */}
          <div className="pb-8 border-b border-cirqa-negro/10">
            <div className="flex items-center gap-2 mb-3">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-cirqa-negro/50 hover:text-cirqa-negro transition-colors uppercase tracking-wider font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Inicio</span>
              </Link>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="text-[11px] uppercase tracking-[0.25em] text-cirqa-primario font-semibold block mb-2">
                  Catálogo Oficial · CIRQA
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-cirqa-negro">
                  Colección Oficial
                </h1>
                <p className="text-xs sm:text-sm text-cirqa-negro/80 font-medium max-w-2xl mt-2 tracking-wide uppercase leading-relaxed">
                  INGENIERÍA ÓPTICA, 4 NIVELES DE BLOQUEO. SELECCIONÁ EL MODELO Y PERSONALIZÁ SUS CRISTALES CIRCADIANOS.
                </p>
              </div>

              {/* Barra de Búsqueda y Filtros Rápidos */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cirqa-negro/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por modelo..."
                    className="pl-10 pr-4 py-2.5 rounded-full border border-cirqa-negro/15 text-xs bg-cirqa-surface text-cirqa-negro placeholder:text-cirqa-negro/40 focus:outline-none focus:border-cirqa-negro focus:bg-white transition-all w-full sm:w-64"
                  />
                </div>
              </div>
            </div>

            {/* Filtros Rápidos por Cristal Circadiano y Acceso a Estudios Oficiales */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pb-1">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                <span className="text-[11px] uppercase tracking-wider text-cirqa-negro/50 font-semibold mr-1 flex items-center gap-1.5 flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cristal Circadiano:</span>
                </span>
                {CIRCADIAN_FILTER_TABS.map((tab) => {
                  const isSelected = selectedFilterTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedFilterTab(tab.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${isSelected
                          ? 'bg-cirqa-negro text-white shadow-sm'
                          : 'bg-black/5 text-cirqa-negro/70 hover:text-cirqa-negro hover:bg-black/10'
                        }`}
                    >
                      {tab.id !== 'ALL' && (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: tab.color }}
                        />
                      )}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Botón para ver Ensayos y Certificaciones Oficiales */}
              <button
                type="button"
                onClick={() => {
                  setActiveTrialFilterId(selectedFilterTab !== 'ALL' ? selectedFilterTab : 'dia');
                  setTrialsOpen(true);
                }}
                className="px-4 py-1.5 rounded-full text-xs font-semibold border border-cirqa-negro/15 text-cirqa-negro hover:bg-black/5 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                title="Ver reportes y certificaciones oficiales de laboratorio"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cirqa-primario" />
                <span>Estudios Oficiales</span>
              </button>
            </div>
          </div>

          {/* Grilla de Productos */}
          <div className="mt-12">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center bg-cirqa-surface rounded-3xl border border-cirqa-negro/10 max-w-md mx-auto space-y-4">
                <p className="text-xs text-cirqa-negro/70">
                  No se pudo cargar el catálogo de productos en este momento.
                </p>
                <button
                  onClick={refetch}
                  className="px-4 py-2 bg-cirqa-negro text-white rounded-full text-xs font-medium inline-flex items-center gap-2 hover:bg-black/80 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reintentar</span>
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-cirqa-surface rounded-3xl border border-cirqa-negro/10 max-w-lg mx-auto space-y-3">
                <p className="text-sm font-medium text-cirqa-negro">
                  No se encontraron armazones para la búsqueda "{searchQuery}".
                </p>
                <p className="text-xs text-cirqa-negro/50">
                  Prueba restableciendo los filtros o buscando por código (ej. Q-001).
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilterTab('ALL');
                  }}
                  className="px-4 py-2 border border-cirqa-negro/20 rounded-full text-xs font-semibold text-cirqa-negro hover:bg-black/5 transition-all"
                >
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {filteredProducts.map((product) => {
                  const pId = product.id || product._id;
                  const activeVarKey = cardSelectedVariant[pId] || null;

                  return (
                    <ProductCard
                      key={pId}
                      product={product}
                      selectedVariantKey={selectedFilterTab !== 'ALL' ? selectedFilterTab : activeVarKey}
                      onVariantChange={(id, vKey) => {
                        setCardSelectedVariant((prev) => ({
                          ...prev,
                          [id]: vKey,
                        }));
                      }}
                      onOpenConfigurator={(model, vKey) => {
                        handleOpenConfigurator(model, vKey);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      <PhilosophyAndFooter
        onOpenTrials={handleOpenTrials}
        onOpenPrescription={() => handleOpenPrescription(null)}
      />

      <ConfiguratorModal
        isOpen={configuratorOpen}
        onClose={() => setConfiguratorOpen(false)}
        initialModel={activeModel}
        initialVariantKey={activeVariantKey}
        onOpenPrescription={(model) => handleOpenPrescription(model)}
        onOpenTrials={handleOpenTrials}
      />

      <CircadianQuizModal
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
        onSelectRecommendation={handleQuizRecommendation}
      />

      <PrescriptionDrawer
        isOpen={prescriptionOpen}
        onClose={() => setPrescriptionOpen(false)}
        selectedModel={activePrescriptionModel}
      />

      <ClinicalTrialsModal
        isOpen={trialsOpen}
        onClose={() => setTrialsOpen(false)}
        initialFilterId={activeTrialFilterId}
      />
    </div>
  );
}
