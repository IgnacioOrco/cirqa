import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Glasses, Sparkles, Layers, ShieldCheck, Plus, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('cirqa_token');
    const savedAdmin = localStorage.getItem('cirqa_admin');

    if (!savedToken) {
      navigate('/login');
      return;
    }

    setToken(savedToken);
    if (savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch {
        setAdmin({ email: 'Administrador' });
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('cirqa_token');
    localStorage.removeItem('cirqa_admin');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-cirqa-negro font-montserrat flex flex-col selection:bg-cirqa-arena selection:text-cirqa-negro">
      
      {/* Top Admin Navigation */}
      <header className="bg-white border-b border-cirqa-negro/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-medium tracking-tight text-cirqa-negro flex items-center gap-2">
              <span className="font-light">CIRQA</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-cirqa-surface px-2.5 py-1 rounded-full text-cirqa-primario border border-cirqa-negro/5">
                ADMIN
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-cirqa-negro">{admin?.email || 'admin@cirqa.com'}</span>
              <span className="text-[10px] text-cirqa-negro/50 font-light">Sesión autorizada</span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-full hover:bg-black/5 text-cirqa-negro/70 hover:text-cirqa-negro transition-colors flex items-center gap-1.5 text-xs font-medium border border-cirqa-negro/10"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-grow space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-cirqa-negro/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-cirqa-primario block mb-1">
              PANEL DE CONTROL · PRE-LANZAMIENTO 2026
            </span>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-cirqa-negro">
              Bienvenido, {admin?.email?.split('@')[0] || 'Administrador'}
            </h1>
            <p className="text-xs sm:text-sm text-cirqa-negro/60 font-light mt-1">
              Conexión autenticada con la API RESTful de CIRQA mediante JWT.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full self-start md:self-auto">
            <CheckCircle2 className="w-4 h-4" />
            <span>API Token Activo</span>
          </div>
        </div>

        {/* Catalog Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Armazones */}
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl p-7 border border-cirqa-negro/10 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cirqa-surface flex items-center justify-center text-cirqa-primario mb-4">
                <Glasses className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-medium text-cirqa-negro">Catálogo de Armazones</h2>
              <p className="text-xs text-cirqa-negro/60 font-light mt-1 leading-relaxed">
                Gestión de los modelos Q1, Q2, Q3, Q4 y Q5, stocks, imágenes y disponibilidad.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-cirqa-negro/5 flex items-center justify-between text-xs">
              <span className="text-[11px] text-cirqa-negro/50">5 Modelos Activos</span>
              <span className="font-semibold text-cirqa-primario">Endpoint: /api/products</span>
            </div>
          </motion.div>

          {/* Card 2: Cristales Circadianos */}
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl p-7 border border-cirqa-negro/10 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cirqa-surface flex items-center justify-center text-cirqa-primario mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-medium text-cirqa-negro">Filtros & Espectros</h2>
              <p className="text-xs text-cirqa-negro/60 font-light mt-1 leading-relaxed">
                Calibraciones Clear, Día (84%), Transición (95%) y Noche (100%).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-cirqa-negro/5 flex items-center justify-between text-xs">
              <span className="text-[11px] text-cirqa-negro/50">4 Cristales Configurados</span>
              <span className="font-semibold text-cirqa-primario">Endpoint: /api/filters</span>
            </div>
          </motion.div>

          {/* Card 3: Seguridad & Base de Datos */}
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl p-7 border border-cirqa-negro/10 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cirqa-surface flex items-center justify-center text-cirqa-primario mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-medium text-cirqa-negro">Servidor & Base de Datos</h2>
              <p className="text-xs text-cirqa-negro/60 font-light mt-1 leading-relaxed">
                MongoDB alojado en VPS remoto DonWeb con autenticación por Bearer Token.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-cirqa-negro/5 flex items-center justify-between text-xs">
              <span className="text-[11px] text-cirqa-negro/50">Conexión Segura</span>
              <span className="font-semibold text-cirqa-primario">VPS DonWeb</span>
            </div>
          </motion.div>

        </div>

        {/* Quick Links Back */}
        <div className="pt-4 flex justify-between items-center text-xs text-cirqa-negro/60">
          <Link to="/" className="inline-flex items-center gap-2 hover:text-cirqa-negro transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Ver tienda pública</span>
          </Link>
          <span className="font-mono text-[11px]">CIRQA ADMIN v1.0.0</span>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-cirqa-negro/5 bg-white text-center text-[10px] text-cirqa-negro/40 tracking-wider">
        CIRQA OPTICAL ARCHITECTURE · PANEL DE ADMINISTRACIÓN
      </footer>

    </div>
  );
}
