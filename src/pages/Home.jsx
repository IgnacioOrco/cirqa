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

export default function Home() {
  // State for Adaptive Glassmorphism Navbar (light / dark)
  const [isNavbarDark, setIsNavbarDark] = useState(false);

  // State for Configurator Modal
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [activeConfigModel, setActiveConfigModel] = useState(null);
  const [activeConfigFilter, setActiveConfigFilter] = useState(null);

  // State for Prescription Side Drawer
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [activePrescriptionModel, setActivePrescriptionModel] = useState(null);
  const [activePrescriptionFilter, setActivePrescriptionFilter] = useState(null);

  // State for Clinical Trials Modal
  const [trialsOpen, setTrialsOpen] = useState(false);
  const [activeTrialFilterId, setActiveTrialFilterId] = useState('dia');

  // Handler for opening configurator modal with a specific model
  const handleOpenConfiguratorWithModel = (model) => {
    setActiveConfigModel(model);
    setConfiguratorOpen(true);
  };

  // Handler for opening configurator modal with a specific filter
  const handleOpenConfiguratorWithFilter = (filter) => {
    setActiveConfigFilter(filter);
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
      <Navbar isDark={isNavbarDark} />

      {/* Main Content Area: Exact Sequential Flow */}
      <main className="flex-grow">
        {/* BLOQUE 1: Hero de Campaña */}
        <Hero
          onExploreModels={handleScrollToModels}
          onExploreTech={handleScrollToTech}
        />

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
        onOpenPrescription={handleOpenPrescription}
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
