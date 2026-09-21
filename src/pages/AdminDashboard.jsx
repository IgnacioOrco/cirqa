import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes,
  ClipboardList,
  LogOut,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  RefreshCw,
  Edit3,
  Glasses,
  ExternalLink,
  ShieldCheck,
  Package,
  DollarSign,
  Layers,
  ArrowRight,
  TrendingUp,
  Menu,
} from 'lucide-react';
import { MODELS } from '../data/models';

/**
 * Fallback de datos iniciales para modelos Q1 al Q5
 * Con stock predeterminado para permitir prueba y edición inmediata.
 */
const DEFAULT_INVENTORY = MODELS.filter((m) => ['q001', 'q002', 'q003', 'q004', 'q005'].includes(m.id)).map((m, idx) => ({
  _id: m.id,
  code: m.code || `CIRQA-${m.name.replace(/\s+/g, '')}`,
  name: `${m.name} · ${m.title}`,
  shortName: m.name,
  title: m.title,
  price: m.price,
  stock: [18, 12, 6, 24, 9][idx] ?? 15,
  previewImage: m.previewImage,
  material: m.material,
  isActive: true,
}));

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Estados de autenticación
  const [token, setToken] = useState(null);
  const [admin, setAdmin] = useState(null);

  // Estados de navegación interna del panel
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'orders'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados de productos e inventario
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ connected: false, message: 'Inicializando...' });
  const [searchQuery, setSearchQuery] = useState('');

  // Estados del modal de edición
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Notificación Toast flotante
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // 1. Verificación de ruta privada y carga de credenciales
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

  // 2. Cargar inventario desde la API con fallback local resiliente
  const fetchInventory = async (authToken) => {
    const currentToken = authToken || token || localStorage.getItem('cirqa_token');
    setLoading(true);

    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

    try {
      const response = await fetch(`${baseUrl}/api/products?all=true`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          // Adaptar modelos de la base de datos
          const mapped = result.data.map((item) => {
            const matchedLocal = DEFAULT_INVENTORY.find(
              (d) => d.shortName.toLowerCase() === item.name.toLowerCase() || item.slug?.includes(d._id)
            );
            return {
              _id: item._id,
              code: matchedLocal?.code || `CIRQA-${item.slug?.toUpperCase() || item.name.replace(/\s+/g, '')}`,
              name: matchedLocal ? matchedLocal.name : item.name,
              shortName: matchedLocal?.shortName || item.name,
              title: matchedLocal?.title || 'Armazón Espectral',
              price: item.price ?? item.basePrice ?? 42000,
              stock: item.stock ?? 0,
              previewImage: item.image_url || matchedLocal?.previewImage || '/products/_DSC8649.webp',
              material: matchedLocal?.material || 'Acetato de celulosa',
              isActive: item.isActive !== undefined ? item.isActive : true,
            };
          });
          setProducts(mapped);
          setSyncStatus({ connected: true, message: 'Sincronizado con API remota' });
          return;
        }
      }
      throw new Error('API no devolvió catálogo');
    } catch (err) {
      // Fallback a localStorage o datos locales predeterminados
      const storedLocal = localStorage.getItem('cirqa_inventory_cache');
      if (storedLocal) {
        try {
          setProducts(JSON.parse(storedLocal));
          setSyncStatus({ connected: false, message: 'Modo Local (Cache persistido)' });
          return;
        } catch {
          // fallback a DEFAULT_INVENTORY
        }
      }
      setProducts(DEFAULT_INVENTORY);
      localStorage.setItem('cirqa_inventory_cache', JSON.stringify(DEFAULT_INVENTORY));
      setSyncStatus({ connected: false, message: 'Modo Local (Modelos Q1 a Q5 activos)' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInventory(token);
    }
  }, [token]);

  // Manejo de Cerrar Sesión
  const handleLogout = () => {
    localStorage.removeItem('cirqa_token');
    localStorage.removeItem('cirqa_admin');
    navigate('/login');
  };

  // Abrir modal de edición para un producto
  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setEditPrice(String(product.price));
    setEditStock(String(product.stock));
    setModalError(null);
    setSaveSuccess(false);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    if (saving) return;
    setSelectedProduct(null);
    setModalError(null);
    setSaveSuccess(false);
  };

  // Actualizar stock y precio con inyección de JWT
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setModalError(null);

    const numericPrice = Number(editPrice);
    const numericStock = Number(editStock);

    if (isNaN(numericPrice) || numericPrice < 0) {
      setModalError('Por favor introduce un precio numérico válido mayor o igual a 0.');
      return;
    }

    if (isNaN(numericStock) || numericStock < 0 || !Number.isInteger(numericStock)) {
      setModalError('El stock debe ser un número entero mayor o igual a 0.');
      return;
    }

    setSaving(true);
    const currentToken = token || localStorage.getItem('cirqa_token');
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

    let apiSuccess = false;

    // Intentar actualización vía API con Bearer JWT si el producto tiene ID de MongoDB
    if (selectedProduct._id && selectedProduct._id.length > 10) {
      try {
        const response = await fetch(`${baseUrl}/api/products/${selectedProduct._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            price: numericPrice,
            stock: numericStock,
          }),
        });

        if (response.ok) {
          apiSuccess = true;
        }
      } catch (err) {
        console.warn('No fue posible contactar la API remota, persistiendo cambios localmente.', err);
      }
    }

    // Actualización de estado local inmediata y persistencia
    const updatedProducts = products.map((p) => {
      if (p._id === selectedProduct._id || p.code === selectedProduct.code) {
        return {
          ...p,
          price: numericPrice,
          stock: numericStock,
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    localStorage.setItem('cirqa_inventory_cache', JSON.stringify(updatedProducts));

    setSaving(false);
    setSaveSuccess(true);
    showToast(
      apiSuccess
        ? `"${selectedProduct.shortName}" actualizado con éxito en la API.`
        : `"${selectedProduct.shortName}" actualizado correctamente.`
    );

    setTimeout(() => {
      handleCloseModal();
    }, 700);
  };

  // Filtro de búsqueda
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.shortName.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Métricas rápidas para el dashboard
  const metrics = useMemo(() => {
    const totalUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    const totalValue = products.reduce((acc, p) => acc + (p.price || 0) * (p.stock || 0), 0);
    const lowStockCount = products.filter((p) => (p.stock || 0) <= 5).length;
    return {
      totalModels: products.length,
      totalUnits,
      totalValue,
      lowStockCount,
    };
  }, [products]);

  // Formateador de moneda en pesos argentinos
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper para el badge de Estado Apple-style
  const getStatusBadge = (stock) => {
    if (stock <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#AC1917]/10 text-[#AC1917] border border-[#AC1917]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#AC1917]" />
          Agotado
        </span>
      );
    }
    if (stock <= 5) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#EFBA40]/15 text-[#8F650A] border border-[#EFBA40]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EFBA40]" />
          Bajo Stock ({stock})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Disponible
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-cirqa-negro font-montserrat flex flex-col md:flex-row antialiased selection:bg-cirqa-arena selection:text-cirqa-negro">
      
      {/* ========================================================================= */}
      {/* 1. SIDEBAR: Menú Lateral Neutro Negro (bg-[#201610] text-white)            */}
      {/* ========================================================================= */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-[#201610] text-white z-40 flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out border-r border-[#2d2018] shadow-2xl md:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-8">
          {/* Logo & Marca CIRQA */}
          <div className="flex items-center justify-between pt-2">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-light tracking-widest text-white group-hover:text-cirqa-arena transition-colors">
                CIRQA
              </span>
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] bg-white/10 text-cirqa-arena px-2 py-0.5 rounded-full border border-white/10">
                ADMIN
              </span>
            </Link>

            {/* Botón cerrar sidebar en móvil */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10"
              aria-label="Cerrar Menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtítulo Estilo Apple */}
          <div className="px-1">
            <p className="text-[11px] font-light text-white/50 tracking-wider uppercase">
              Panel de Arquitectura Óptica
            </p>
          </div>

          {/* Navegación del Menú */}
          <nav className="space-y-2">
            {/* Opción 1: Inventario */}
            <button
              onClick={() => {
                setActiveTab('inventory');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-medium tracking-wide transition-all ${
                activeTab === 'inventory'
                  ? 'bg-white text-cirqa-negro shadow-md font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Boxes className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-cirqa-primario' : 'text-cirqa-arena'}`} />
                <span>Inventario</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === 'inventory'
                    ? 'bg-cirqa-negro/5 text-cirqa-negro font-bold'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                {products.length}
              </span>
            </button>

            {/* Opción 2: Órdenes (Próximamente) */}
            <button
              onClick={() => {
                setActiveTab('orders');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-medium tracking-wide transition-all ${
                activeTab === 'orders'
                  ? 'bg-white text-cirqa-negro shadow-md font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className={`w-4 h-4 ${activeTab === 'orders' ? 'text-cirqa-primario' : 'text-white/40'}`} />
                <span>Órdenes</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-semibold bg-cirqa-arena/20 text-cirqa-arena px-2 py-0.5 rounded-full border border-cirqa-arena/30">
                Próximamente
              </span>
            </button>
          </nav>
        </div>

        {/* Sección Inferior del Sidebar: Admin info & Cerrar Sesión */}
        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="px-2">
            <div className="flex items-center gap-2 text-xs font-medium text-white/90">
              <ShieldCheck className="w-4 h-4 text-cirqa-arena" />
              <span className="truncate">{admin?.email || 'admin@cirqa.com'}</span>
            </div>
            <p className="text-[10px] text-white/40 font-light mt-0.5 pl-6">Token JWT activo</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/15"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>

          <div className="text-center pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[10px] text-white/40 hover:text-cirqa-arena transition-colors"
            >
              <span>Ver tienda pública</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Backdrop para cerrar sidebar en mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* ========================================================================= */}
      {/* 2. ÁREA PRINCIPAL: Estética Apple (Neutro-Blanco, Arena, Montserrat)        */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar móvil */}
        <header className="md:hidden bg-white px-6 py-4 border-b border-black/5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-cirqa-negro/80 hover:text-cirqa-negro rounded-xl"
              aria-label="Abrir Menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-medium text-sm tracking-wide">CIRQA ADMIN</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-cirqa-negro/60 hover:text-cirqa-negro"
          >
            Salir
          </button>
        </header>

        {/* Contenido Principal */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-8">
          
          {/* Header Superior del Dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-cirqa-primario">
                  PANEL PRIVADO DE CONTROL
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cirqa-arena" />
                <span className="text-[10px] text-cirqa-negro/40 tracking-wider">
                  {syncStatus.message}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-cirqa-negro">
                {activeTab === 'inventory' ? 'Gestión de Inventario' : 'Órdenes de Compra'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchInventory(token)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-cirqa-negro/10 text-cirqa-negro/70 hover:text-cirqa-negro hover:border-cirqa-negro/25 text-xs font-medium transition-all shadow-sm disabled:opacity-50"
                title="Sincronizar con API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cirqa-primario' : ''}`} />
                <span>Actualizar</span>
              </button>

              <Link
                to="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-cirqa-negro hover:bg-cirqa-primario text-white text-xs font-medium tracking-wide transition-all shadow-sm"
              >
                <span>Catálogo Web</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* VISTA 1: INVENTARIO */}
          {activeTab === 'inventory' && (
            <>
              {/* Tarjetas de Métricas Resumen (Estilo Apple, Fondos Blanco y Arena) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                
                {/* Métrica 1: Modelos Activos */}
                <div className="bg-white rounded-3xl p-6 border border-cirqa-negro/5 shadow-sm">
                  <div className="flex items-center justify-between text-cirqa-negro/40 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Modelos</span>
                    <Glasses className="w-4 h-4 text-cirqa-arena" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-light text-cirqa-negro">
                    {metrics.totalModels}
                  </div>
                  <p className="text-[11px] text-cirqa-negro/50 font-light mt-1">
                    Línea Q1 al Q5
                  </p>
                </div>

                {/* Métrica 2: Unidades en Stock */}
                <div className="bg-white rounded-3xl p-6 border border-cirqa-negro/5 shadow-sm">
                  <div className="flex items-center justify-between text-cirqa-negro/40 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Stock Total</span>
                    <Package className="w-4 h-4 text-cirqa-primario" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-light text-cirqa-negro">
                    {metrics.totalUnits}
                  </div>
                  <p className="text-[11px] text-cirqa-negro/50 font-light mt-1">
                    Piezas disponibles
                  </p>
                </div>

                {/* Métrica 3: Valoración de Inventario */}
                <div className="bg-white rounded-3xl p-6 border border-cirqa-negro/5 shadow-sm">
                  <div className="flex items-center justify-between text-cirqa-negro/40 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Valor Inventario</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-light text-cirqa-negro truncate">
                    {formatMoney(metrics.totalValue)}
                  </div>
                  <p className="text-[11px] text-cirqa-negro/50 font-light mt-1">
                    Precio retail total
                  </p>
                </div>

                {/* Métrica 4: Alertas de Stock */}
                <div className="bg-white rounded-3xl p-6 border border-cirqa-negro/5 shadow-sm">
                  <div className="flex items-center justify-between text-cirqa-negro/40 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Alertas</span>
                    <AlertCircle className={`w-4 h-4 ${metrics.lowStockCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
                  </div>
                  <div className="text-2xl sm:text-3xl font-light text-cirqa-negro">
                    {metrics.lowStockCount}
                  </div>
                  <p className="text-[11px] text-cirqa-negro/50 font-light mt-1">
                    {metrics.lowStockCount > 0 ? 'Modelos con ≤ 5 unidades' : 'Inventario equilibrado'}
                  </p>
                </div>

              </div>

              {/* Barra de Filtro y Búsqueda */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-cirqa-negro/5 shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-cirqa-negro/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por código o modelo (ej. Q001, Aviator)..."
                    className="w-full pl-11 pr-4 py-2.5 bg-[#FBFBFA] border border-cirqa-negro/10 rounded-2xl text-xs text-cirqa-negro placeholder-cirqa-negro/40 focus:outline-none focus:border-cirqa-negro focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-cirqa-negro/40 hover:text-cirqa-negro"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-cirqa-negro/50 px-2">
                  <span>Mostrando {filteredProducts.length} de {products.length} modelos</span>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 3. TABLA DE DATOS: CSS Grid (grid-cols-5), divisores horizontales sutiles   */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-3xl border border-cirqa-negro/10 shadow-sm overflow-hidden">
                
                {/* Encabezado de la Tabla (Grid de 5 columnas) */}
                <div className="grid grid-cols-5 px-6 py-4 bg-[#FBFBFA] border-b border-cirqa-negro/10 text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60 select-none">
                  <div>Código</div>
                  <div className="col-span-1">Nombre</div>
                  <div>Precio</div>
                  <div>Stock</div>
                  <div className="text-right">Estado</div>
                </div>

                {/* Filas de la Tabla */}
                {loading && products.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-cirqa-primario mx-auto" />
                    <p className="text-xs text-cirqa-negro/60 font-light">Cargando inventario de CIRQA...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <Package className="w-8 h-8 text-cirqa-negro/20 mx-auto" />
                    <p className="text-sm font-medium text-cirqa-negro/70">No se encontraron modelos coincidentes</p>
                    <p className="text-xs text-cirqa-negro/40 font-light">Prueba ajustando el término de búsqueda.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-cirqa-negro/5">
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product._id || product.code}
                        onClick={() => handleOpenEdit(product)}
                        whileHover={{ backgroundColor: 'rgba(251, 249, 246, 0.9)' }}
                        transition={{ duration: 0.15 }}
                        className="grid grid-cols-5 px-6 py-4 items-center cursor-pointer group transition-colors select-none"
                      >
                        {/* Columna 1: Código */}
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-cirqa-negro group-hover:text-cirqa-primario transition-colors">
                            {product.code}
                          </span>
                        </div>

                        {/* Columna 2: Nombre */}
                        <div className="flex items-center gap-3 pr-2">
                          <div className="w-10 h-10 rounded-xl bg-[#F4EFEA] overflow-hidden flex-shrink-0 flex items-center justify-center border border-cirqa-negro/5">
                            {product.previewImage ? (
                              <img
                                src={product.previewImage}
                                alt={product.shortName}
                                className="w-full h-full object-contain p-0.5 group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Glasses className="w-5 h-5 text-cirqa-negro/30" />
                            )}
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-medium text-cirqa-negro block truncate">
                              {product.shortName}
                            </span>
                            <span className="text-[10px] text-cirqa-negro/45 font-light truncate block">
                              {product.title}
                            </span>
                          </div>
                        </div>

                        {/* Columna 3: Precio */}
                        <div>
                          <span className="text-xs font-medium text-cirqa-negro font-mono">
                            {formatMoney(product.price)}
                          </span>
                        </div>

                        {/* Columna 4: Stock */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-cirqa-negro font-mono">
                            {product.stock}
                          </span>
                          <span className="text-[10px] text-cirqa-negro/40 font-light hidden sm:inline">
                            unidades
                          </span>
                        </div>

                        {/* Columna 5: Estado */}
                        <div className="flex items-center justify-end gap-3">
                          {getStatusBadge(product.stock)}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-black/5 text-cirqa-primario">
                            <Edit3 className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Pie de Tabla con Guía Rápida */}
                <div className="px-6 py-3.5 bg-[#FBFBFA]/60 border-t border-cirqa-negro/5 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-cirqa-negro/50 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cirqa-primario" />
                    <span>Haz clic en cualquier fila para editar el precio y stock en tiempo real.</span>
                  </div>
                  <span className="font-mono text-[10px]">CIRQA INVENTORY ENGINE · v1.0</span>
                </div>

              </div>
            </>
          )}

          {/* VISTA 2: ÓRDENES (Próximamente) */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl p-12 border border-cirqa-negro/10 shadow-sm text-center max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-cirqa-surface mx-auto flex items-center justify-center text-cirqa-arena border border-cirqa-negro/5">
                <ClipboardList className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-cirqa-primario">
                  MÓDULO EN CONSTRUCCIÓN
                </span>
                <h2 className="text-2xl font-light tracking-tight text-cirqa-negro">
                  Gestión de Órdenes & Envíos
                </h2>
                <p className="text-xs text-cirqa-negro/60 font-light leading-relaxed max-w-md mx-auto">
                  La integración directa con Mercado Pago y pasarelas de pago se encuentra en sincronización. Las compras generadas en la tienda pública se registrarán automáticamente aquí.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="px-6 py-3 rounded-full bg-cirqa-negro hover:bg-cirqa-primario text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-md"
                >
                  Volver al Inventario
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL DE EDICIÓN: Framer Motion (resorte suave), Glassmorphism, Inputs   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            
            {/* Backdrop con Glassmorphism (backdrop-blur-xl) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/40 backdrop-blur-xl"
            />

            {/* Contenedor del Modal con Físicas de Resorte Suaves */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 28,
              }}
              className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-3xl p-6 sm:p-8 text-cirqa-negro overflow-hidden z-10"
            >
              
              {/* Botón Cerrar */}
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="absolute top-6 right-6 p-2 rounded-full text-cirqa-negro/40 hover:text-cirqa-negro hover:bg-black/5 transition-all"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Encabezado del Modal con Thumbnail */}
              <div className="flex items-center gap-4 pb-6 border-b border-cirqa-negro/10">
                <div className="w-16 h-16 rounded-2xl bg-[#F4EFEA] border border-cirqa-negro/5 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {selectedProduct.previewImage ? (
                    <img
                      src={selectedProduct.previewImage}
                      alt={selectedProduct.shortName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Glasses className="w-8 h-8 text-cirqa-negro/30" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-cirqa-primario font-semibold block">
                    {selectedProduct.code}
                  </span>
                  <h3 className="text-xl font-light tracking-tight text-cirqa-negro">
                    {selectedProduct.shortName}
                  </h3>
                  <p className="text-xs text-cirqa-negro/50 font-light">
                    {selectedProduct.title}
                  </p>
                </div>
              </div>

              {/* Mensaje de Error en Modal */}
              {modalError && (
                <div className="mt-4 p-3.5 rounded-2xl bg-[#AC1917]/10 border border-[#AC1917]/20 text-[#AC1917] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Formulario de Edición */}
              <form onSubmit={handleSaveProduct} className="mt-6 space-y-6">
                
                {/* Input 1: Precio (border-b focus:border-cirqa-primario bg-transparent) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70">
                      Precio de Venta ($ ARS)
                    </label>
                    <span className="text-[10px] text-cirqa-negro/40">
                      Actual: {formatMoney(selectedProduct.price)}
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-0 text-sm font-mono text-cirqa-negro/40 font-semibold">$</span>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="42000"
                      className="w-full pl-6 pr-4 py-3 bg-transparent border-b border-cirqa-negro/20 focus:border-cirqa-primario text-lg font-mono text-cirqa-negro focus:outline-none transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-cirqa-negro/40 mt-1 font-light">
                    Vista previa formateada: {formatMoney(Number(editPrice) || 0)}
                  </p>
                </div>

                {/* Input 2: Stock (border-b focus:border-cirqa-primario bg-transparent) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70">
                      Unidades Disponibles (Stock)
                    </label>
                    <span className="text-[10px] text-cirqa-negro/40">
                      Actual: {selectedProduct.stock} uds.
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      placeholder="10"
                      className="w-full pr-16 py-3 bg-transparent border-b border-cirqa-negro/20 focus:border-cirqa-primario text-lg font-mono text-cirqa-negro focus:outline-none transition-colors"
                    />
                    <span className="absolute right-0 text-xs text-cirqa-negro/40 font-light">
                      unidades
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-cirqa-negro/40">
                      Estado resultante:
                    </span>
                    <div>
                      {getStatusBadge(Number(editStock) || 0)}
                    </div>
                  </div>
                </div>

                {/* Resumen de Seguridad JWT */}
                <div className="p-3 bg-cirqa-surface rounded-2xl border border-cirqa-negro/5 flex items-center gap-2.5 text-[11px] text-cirqa-negro/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    La actualización inyectará el token JWT en el encabezado <code className="font-mono text-[10px] bg-black/5 px-1 py-0.5 rounded">Authorization: Bearer</code>.
                  </span>
                </div>

                {/* Botones de Acción */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={saving}
                    className="px-5 py-3 rounded-full text-xs font-medium text-cirqa-negro/70 hover:text-cirqa-negro hover:bg-black/5 transition-all"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-7 py-3 rounded-full bg-cirqa-negro hover:bg-cirqa-primario active:scale-[0.98] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>¡Guardado!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Actualizar Producto</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. TOAST NOTIFICACIÓN FLOTANTE                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-cirqa-negro text-white shadow-2xl border border-white/10 text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-cirqa-arena flex-shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
