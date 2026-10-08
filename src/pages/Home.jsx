import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProductShowcaseCarousel from '../components/ProductShowcaseCarousel';
import CircadianInfographic from '../components/CircadianInfographic';
import StillLifeCarousel from '../components/StillLifeCarousel';
import ComparisonTable from '../components/ComparisonTable';
import FilterDetailsCampaign from '../components/FilterDetailsCampaign';
import AboutManifesto from '../components/AboutManifesto';
import FAQAndContact from '../components/FAQAndContact';
import PrescriptionDrawer from '../components/PrescriptionDrawer';
import ClinicalTrialsModal from '../components/ClinicalTrialsModal';
import ConfiguratorModal from '../components/ConfiguratorModal';
import PhilosophyAndFooter from '../components/PhilosophyAndFooter';
import CircadianQuizModal from '../components/CircadianQuizModal';
import { Sparkles, ArrowRight, Sun, Moon } from 'lucide-react';

export default function Home() {
  // State for Adaptive Glassmorphism Navbar (light / dark)
  const [isNavbarDark, setIsNavbarDark] = useState(false);

  // State for Configurator Modal
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [activeConfigModel, setActiveConfigModel] = useState(null);
  const [activeConfigFilter, setActiveConfigFilter] = useState(null);
  const [activeConfigVariantKey, setActiveConfigVariantKey] = useState(null);

  // State for Circadian Quiz Modal
  const [quizOpen, setQuizOpen] = useState(false);

  // State for Prescription Side Drawer
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [activePrescriptionModel, setActivePrescriptionModel] = useState(null);
  const [activePrescriptionFilter, setActivePrescriptionFilter] = useState(null);

  // State for Clinical Trials Modal
  const [trialsOpen, setTrialsOpen] = useState(false);
  const [activeTrialFilterId, setActiveTrialFilterId] = useState('dia');

  // Listener para apertura global del quiz
  React.useEffect(() => {
    const handleOpenQuizEvent = () => setQuizOpen(true);
    window.addEventListener('open-circadian-quiz', handleOpenQuizEvent);

    if (window.location.search.includes('quiz=true')) {
      setQuizOpen(true);
    }

    return () => {
      window.removeEventListener('open-circadian-quiz', handleOpenQuizEvent);
    };
  }, []);

  // Handler for opening configurator modal with a specific model
  const handleOpenConfiguratorWithModel = (model) => {
    setActiveConfigModel(model);
    setActiveConfigVariantKey(null);
    setConfiguratorOpen(true);
  };

  // Handler for opening configurator modal with a specific filter
  const handleOpenConfiguratorWithFilter = (filter) => {
    setActiveConfigFilter(filter);
    setActiveConfigVariantKey(null);
    setConfiguratorOpen(true);
  };

  // Handler para aplicar la recomendación del test circadiano
  const handleQuizRecommendation = (recommendedProduct, recommendedVariantKey) => {
    setActiveConfigModel(recommendedProduct);
    setActiveConfigVariantKey(recommendedVariantKey);
    setConfiguratorOpen(true);
  };

  // Handler for opening prescription drawer
  const handleOpenPrescription = (model = null, filter = null) => {
    setActivePrescriptionModel(model);
    setActivePrescriptionFilter(filter);
    setPrescriptionOpen(true);
  };

  // Handler for opening clinical trials modal
  const handleOpenTrials = (filterId = 'dia') => {
    setActiveTrialFilterId(filterId);
    setTrialsOpen(true);
  };

  // Handler for smooth scroll to models section
  const handleScrollToModels = () => {
    const el = document.getElementById('pasarela-productos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handler for smooth scroll to technology section
  const handleScrollToTech = () => {
    const el = document.getElementById('tecnologia');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-cirqa-negro font-montserrat flex flex-col selection:bg-cirqa-arena selection:text-cirqa-negro">
      {/* 1. Adaptive Glassmorphism Navbar */}
      <Navbar isDark={isNavbarDark} onOpenQuiz={() => setQuizOpen(true)} />

      {/* Main Content Area: Exact Sequential Flow */}
      <main className="flex-grow">
        {/* BLOQUE 1: Hero de Campaña */}
        <Hero
          onExploreModels={handleScrollToModels}
          onExploreTech={handleScrollToTech}
        />

        {/* SECCIÓN DIAGNÓSTICO: Test Circadiano "Descubrí tu rutina" */}
        <section className="py-12 bg-[#FBFBFA] border-y border-cirqa-negro/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="relative rounded-3xl bg-cirqa-negro text-white p-8 sm:p-12 md:p-14 overflow-hidden shadow-2xl border border-white/10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-cirqa-carmin/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-amber-400 font-semibold mb-3 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Diagnóstico Óptico Personalizado
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white leading-tight">
                  Descubrí tu rutina circadiana
                </h2>
                <p className="text-sm sm:text-base text-white/70 font-light mt-3 leading-relaxed">
                  ¿Trabajás intensamente frente a monitores o te cuesta conciliar el sueño por la noche? Respondé 3 preguntas clave y descubrí el armazón y cristal calibrados para tu biología visual.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <button
                    onClick={() => setQuizOpen(true)}
                    className="py-3.5 px-8 rounded-full bg-white hover:bg-cirqa-arena text-cirqa-negro text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2.5 transition-all shadow-lg hover:shadow-xl cursor-pointer group"
                  >
                    <span>Hacer test diagnóstico (1 min)</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <span className="text-xs text-white/40 font-mono text-center sm:text-left">
                    Sin registro previo · Preselección automática
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE 2: Pasarela de Productos (Carrusel de Armazones) */}
        <ProductShowcaseCarousel
          onSelectModel={handleOpenConfiguratorWithModel}
        />

        {/* BLOQUE 3: Infografía Ritmo Circadiano (24h & 8 Pilares) */}
        <CircadianInfographic />

        {/* BLOQUE 4: Pasarela "Still Life" (Contextos Reales) */}
        <StillLifeCarousel />

        {/* BLOQUE 5: Tabla Comparativa (4 Filtros & Compra Ahora) */}
        <ComparisonTable
          onSelectFilterForPurchase={handleOpenConfiguratorWithFilter}
        />

        {/* BLOQUE 6: Detalle de Filtros (Animación 3 Filtros & Estudio) */}
        <FilterDetailsCampaign
          onOpenTrials={handleOpenTrials}
          onThemeChange={setIsNavbarDark}
        />

        {/* SECCIÓN NOSOTROS: Manifiesto CIRQA & Fotografía de Campaña */}
        <AboutManifesto onExploreModels={handleScrollToModels} />

        {/* MÓDULO FAQ (Acordeón) & FORMULARIO DE CONTACTO DIRECTO */}
        <FAQAndContact />
      </main>

      {/* BLOQUE 7: Footer Legal & Contacto */}
      <PhilosophyAndFooter
        onOpenTrials={handleOpenTrials}
        onOpenPrescription={() => handleOpenPrescription(null, null)}
      />

      {/* Interactive Configurator Modal */}
      <ConfiguratorModal
        isOpen={configuratorOpen}
        onClose={() => setConfiguratorOpen(false)}
        initialModel={activeConfigModel}
        initialFilter={activeConfigFilter}
        initialVariantKey={activeConfigVariantKey}
        onOpenPrescription={handleOpenPrescription}
      />

      {/* Circadian Quiz Modal */}
      <CircadianQuizModal
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
        onSelectRecommendation={handleQuizRecommendation}
      />

      {/* Side Panels & Modals */}
      <PrescriptionDrawer
        isOpen={prescriptionOpen}
        onClose={() => setPrescriptionOpen(false)}
        selectedModel={activePrescriptionModel}
        selectedFilter={activePrescriptionFilter}
      />

      <ClinicalTrialsModal
        isOpen={trialsOpen}
        onClose={() => setTrialsOpen(false)}
        initialFilterId={activeTrialFilterId}
      />
    </div>
  );
}
