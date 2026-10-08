import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, Filter, SlidersHorizontal, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PhilosophyAndFooter from '../components/PhilosophyAndFooter';
import ConfiguratorModal from '../components/ConfiguratorModal';
import PrescriptionDrawer from '../components/PrescriptionDrawer';
import CircadianQuizModal from '../components/CircadianQuizModal';
import { useProducts, ProductCardSkeleton } from '../hooks/useProducts';
import { FILTERS } from '../data/filters';
import { getProductImage as getStudioProductImage } from '../data/productImages';
import { formatMediaUrl } from '../services/api';

export default function Catalog() {
  const { products, loading, error, refetch } = useProducts({ all: false });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShape, setSelectedShape] = useState('ALL');

  // Configurator Modal state
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [activeModel, setActiveModel] = useState(null);
  const [activeVariantKey, setActiveVariantKey] = useState(null);

  // Circadian Quiz state
  const [quizOpen, setQuizOpen] = useState(false);

  // Prescription Drawer state
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [activePrescriptionModel, setActivePrescriptionModel] = useState(null);

  // Per-card hover & variant selection
  const [cardHoveredId, setCardHoveredId] = useState(null);
  const [cardSelectedVariant, setCardSelectedVariant] = useState({});

  const handleOpenConfigurator = (model) => {
    setActiveModel(model);
    setActiveVariantKey(null);
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

  // Filtrado reactivo de productos
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name?.toLowerCase().includes(query) ||
      p.modelCode?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.frameShape?.toLowerCase().includes(query);

    const matchesShape =
      selectedShape === 'ALL' ||
      p.frameShape?.toLowerCase() === selectedShape.toLowerCase();

    return matchesSearch && matchesShape;
  });

  const uniqueShapes = [
    'ALL',
    ...Array.from(new Set(products.map((p) => p.frameShape).filter(Boolean))),
  ];

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
                  Colección Oficial · CIRQA Biomimetic
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-cirqa-negro">
                  Catálogo de Armazones
                </h1>
                <p className="text-sm text-cirqa-negro/60 font-light max-w-xl mt-2 leading-relaxed">
                  Ingeniería óptica, protección frente a radiación azul y armazones en acetato aeroespacial. Seleccioná un modelo para personalizar sus cristales circadianos y graduación.
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
                    placeholder="Buscar por modelo o forma..."
                    className="pl-10 pr-4 py-2.5 rounded-full border border-cirqa-negro/15 text-xs bg-cirqa-surface text-cirqa-negro placeholder:text-cirqa-negro/40 focus:outline-none focus:border-cirqa-negro focus:bg-white transition-all w-full sm:w-64"
                  />
                </div>
              </div>
            </div>

            {/* Filtros por Silueta / Forma */}
            {uniqueShapes.length > 2 && (
              <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1">
                <span className="text-[11px] uppercase tracking-wider text-cirqa-negro/40 font-semibold mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Forma:</span>
                </span>
                {uniqueShapes.map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setSelectedShape(shape)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      selectedShape === shape
                        ? 'bg-cirqa-negro text-white shadow-xs'
                        : 'bg-black/5 text-cirqa-negro/60 hover:text-cirqa-negro hover:bg-black/10'
                    }`}
                  >
                    {shape === 'ALL' ? 'Todos los Modelos' : shape}
                  </button>
                ))}
              </div>
            )}
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
                    setSelectedShape('ALL');
                  }}
                  className="px-4 py-2 border border-cirqa-negro/20 rounded-full text-xs font-semibold text-cirqa-negro hover:bg-black/5 transition-all"
                >
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {filteredProducts.map((product) => {
                  const isHovered = cardHoveredId === product.id;
                  const activeVarKey = cardSelectedVariant[product.id];

                  // Resolver imagen con soporte para variante
                  let displayImage = product.primaryImage;
                  if (activeVarKey && Array.isArray(product.images)) {
                    const varImg = product.images.find((img) => img.variantKey === activeVarKey);
                    if (varImg) displayImage = varImg.url;
                  } else if (isHovered && product.hoverImage && product.hoverImage !== product.primaryImage) {
                    displayImage = product.hoverImage;
                  }

                  const hasVariants = Boolean(product.hasVariants && product.variants?.length > 0);

                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      onMouseEnter={() => setCardHoveredId(product.id)}
                      onMouseLeave={() => setCardHoveredId(null)}
                      className="bg-white rounded-3xl border border-cirqa-negro/10 overflow-hidden shadow-xs hover:shadow-xl hover:border-cirqa-negro/20 transition-all flex flex-col group"
                    >
                      {/* Contenedor Visual de la Foto */}
                      <div className="aspect-[4/3] bg-gradient-to-b from-[#FBFBFA] to-[#F4EFEA] p-6 relative flex items-center justify-center overflow-hidden border-b border-cirqa-negro/5">
                        <img
                          src={formatMediaUrl(displayImage)}
                          alt={product.name}
                          className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-transform duration-500 select-none"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/products/_DSC8649.webp';
                          }}
                        />

                        {/* Código de Modelo Flotante */}
                        <div className="absolute top-3.5 left-3.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-cirqa-negro/10 text-[10px] font-mono text-cirqa-negro font-semibold">
                          {product.modelCode || product.code}
                        </div>

                        {/* Tag de Silueta */}
                        {product.frameShape && (
                          <div className="absolute top-3.5 right-3.5 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-cirqa-negro/10 text-[9px] text-cirqa-negro/60">
                            {product.frameShape}
                          </div>
                        )}
                      </div>

                      {/* Información y Controles */}
                      <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-cirqa-negro tracking-tight group-hover:text-cirqa-primario transition-colors">
                              {product.name}
                            </h3>
                          </div>
                          <p className="text-[11px] text-cirqa-negro/50 font-light mt-1 line-clamp-2">
                            {product.description || 'Armazón de precisión biomecánica CIRQA.'}
                          </p>
                        </div>

                        {/* Muestras de Variantes Disponibles */}
                        {hasVariants && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-cirqa-negro/50 block">
                              {product.variantAxisTitle || 'Opciones Disponibles'}:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {product.variants.slice(0, 5).map((v) => (
                                <button
                                  key={v.key}
                                  type="button"
                                  onClick={() =>
                                    setCardSelectedVariant((prev) => ({
                                      ...prev,
                                      [product.id]: prev[product.id] === v.key ? null : v.key,
                                    }))
                                  }
                                  title={`${v.name} ${v.subtitle ? `· ${v.subtitle}` : ''}`}
                                  className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                                    activeVarKey === v.key
                                      ? 'ring-2 ring-cirqa-negro scale-110'
                                      : 'hover:scale-110'
                                  }`}
                                  style={{
                                    backgroundColor: v.badgeColor || '#FFFFFF',
                                    borderColor: `${v.badgeColor || '#000000'}88`,
                                  }}
                                />
                              ))}
                              {product.variants.length > 5 && (
                                <span className="text-[9px] text-cirqa-negro/40 font-mono">
                                  +{product.variants.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Dimensiones */}
                        <div className="pt-2 border-t border-cirqa-negro/5 flex items-center justify-between text-[10px] text-cirqa-negro/50 font-mono">
                          <span>{product.lensWidth}mm</span>
                          <span>·</span>
                          <span>{product.bridgeWidth}mm</span>
                          <span>·</span>
                          <span>{product.templeLength}mm</span>
                          <span className="text-[9px] uppercase font-sans text-cirqa-primario font-semibold ml-auto">
                            UV400
                          </span>
                        </div>

                        {/* Botón CTA sin mostrar precio */}
                        <div className="pt-2 border-t border-cirqa-negro/5">
                          <button
                            type="button"
                            onClick={() => handleOpenConfigurator(product)}
                            className="w-full bg-cirqa-negro hover:bg-cirqa-primario text-white text-xs font-bold uppercase tracking-wider py-3 rounded-full transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Configurar Armazón</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      <PhilosophyAndFooter
        onOpenTrials={() => {}}
        onOpenPrescription={() => handleOpenPrescription(null)}
      />

      <ConfiguratorModal
        isOpen={configuratorOpen}
        onClose={() => setConfiguratorOpen(false)}
        initialModel={activeModel}
        initialVariantKey={activeVariantKey}
        onOpenPrescription={(model) => handleOpenPrescription(model)}
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
    </div>
  );
}
