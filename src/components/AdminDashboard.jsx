import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes,
  ClipboardList,
  LogOut,
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
  ArrowRight,
  TrendingUp,
  Menu,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import {
  productService,
  authService,
  handleSessionExpired,
  formatMediaUrl,
} from '../services/api';

const MODEL_SORT_ORDER = {
  q001: 1,
  q002: 2,
  q003: 3,
  q004: 4,
  q005: 5,
};

export default function AdminDashboard({ authToken: propToken, onLogout: propOnLogout }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Estados de autenticación
  const [admin, setAdmin] = useState(() => authService.getAdmin());

  // Estados de navegación interna del panel
  const [activeTab, setActiveTab] = useState('inventory');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados de productos (directos de MongoDB)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados del modal de edición
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Estados para Carga y Preview de Imágenes
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewImageBlob, setPreviewImageBlob] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Notificación Toast flotante
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleLogout = useCallback(() => {
    if (propOnLogout) {
      propOnLogout();
      return;
    }
    authService.logout();
  }, [propOnLogout]);

  const sortModels = (items) => {
    return [...items].sort((a, b) => {
      const slugA = (a.slug || a._id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const slugB = (b.slug || b._id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const orderA = MODEL_SORT_ORDER[slugA] ?? 99;
      const orderB = MODEL_SORT_ORDER[slugB] ?? 99;
      return orderA - orderB;
    });
  };

  // 1. Cargar inventario directamente desde MongoDB en la API en producción
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setErrorStatus(null);

    try {
      try {
        await authService.verify();
      } catch (authErr) {
        if (authErr.status === 401 || authErr.status === 403) {
          handleSessionExpired(true);
          return;
        }
      }

      const data = await productService.getProducts({ all: true });

      const mapped = data.map((item) => ({
        _id: item._id,
        slug: item.slug || item._id,
        code: `CIRQA-${(item.slug || item.name || '').toUpperCase().replace(/[\s-]+/g, '')}`,
        name: item.name,
        shortName: item.name,
        title: item.description || 'Armazón Espectral CIRQA',
        price: Number(item.price ?? item.basePrice ?? 0),
        basePrice: Number(item.basePrice ?? item.price ?? 0),
        stock: Number(item.stock ?? 0),
        previewImage: item.image_url || (Array.isArray(item.images) && item.images[0]) || '/products/_DSC8649.webp',
        isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
      }));

      const sorted = sortModels(mapped);
      setProducts(sorted);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      setErrorStatus(err.message || 'No fue posible conectar con el backend de producción.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Verificación de token al montar
  useEffect(() => {
    const currentToken = propToken || authService.getToken();
    if (!currentToken) {
      navigate('/login', { replace: true });
      return;
    }

    const currentAdmin = authService.getAdmin();
    if (currentAdmin) {
      setAdmin(currentAdmin);
    }

    fetchInventory();
  }, [propToken, navigate, fetchInventory]);

  // Limpieza de memoria de Blob URLs temporales
  const clearTemporaryImage = useCallback(() => {
    if (previewImageBlob) {
      URL.revokeObjectURL(previewImageBlob);
      setPreviewImageBlob(null);
    }
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewImageBlob]);

  // Abrir modal de edición
  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setEditPrice(String(product.price));
    setEditStock(String(product.stock));
    setEditIsActive(product.isActive !== false);
    setModalError(null);
    setSaveSuccess(false);
    setUploadSuccess(false);
    clearTemporaryImage();
  };

  // Cerrar modal de edición
  const handleCloseModal = () => {
    if (saving || uploadingImage) return;
    clearTemporaryImage();
    setSelectedProduct(null);
    setModalError(null);
    setSaveSuccess(false);
    setUploadSuccess(false);
  };

  // Selección de archivo de imagen con preview inmediato
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModalError('Formato no soportado. Selecciona un archivo de imagen (JPG, PNG, WEBP, AVIF).');
      return;
    }

    // Límite de 10 MB
    if (file.size > 10 * 1024 * 1024) {
      setModalError('La imagen seleccionada supera el límite máximo permitido de 10 MB.');
      return;
    }

    if (previewImageBlob) {
      URL.revokeObjectURL(previewImageBlob);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setPreviewImageBlob(objectUrl);
    setModalError(null);
    setUploadSuccess(false);
  };

  // Subir la imagen al servidor VPS vía POST /api/products/:id/image
  const handleUploadImageOnly = async () => {
    if (!selectedImageFile || !selectedProduct) return;

    setUploadingImage(true);
    setModalError(null);

    try {
      const res = await productService.uploadProductImage(selectedProduct._id, selectedImageFile);
      const newImageUrl = res.image_url || res.data?.image_url;

      if (!newImageUrl) {
        throw new Error('La respuesta del servidor no incluyó la URL de la imagen.');
      }

      // Actualizar producto actual en el modal
      setSelectedProduct((prev) => ({
        ...prev,
        previewImage: newImageUrl,
        image_url: newImageUrl,
      }));

      // Actualizar inmediatamente la grilla reactiva sin recargar la página
      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, previewImage: newImageUrl, image_url: newImageUrl }
            : p
        )
      );

      setUploadSuccess(true);
      clearTemporaryImage();
      showToast(`Imagen de "${selectedProduct.shortName}" subida exitosamente a /uploads.`);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      setModalError(err.message || 'Error al subir la imagen al servidor.');
    } finally {
      setUploadingImage(false);
    }
  };

  // 3. Guardar cambios en el backend mediante PUT /api/products/:id (y subir imagen si fue seleccionada)
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

    try {
      let finalImageUrl = selectedProduct.previewImage;

      // Si el usuario seleccionó una nueva imagen y no la subió por separado, subirla ahora
      if (selectedImageFile) {
        try {
          const imgRes = await productService.uploadProductImage(selectedProduct._id, selectedImageFile);
          finalImageUrl = imgRes.image_url || imgRes.data?.image_url || finalImageUrl;
          clearTemporaryImage();
        } catch (imgErr) {
          throw new Error(`Error al procesar la imagen: ${imgErr.message}`);
        }
      }

      const payload = {
        price: numericPrice,
        basePrice: numericPrice,
        stock: numericStock,
        isActive: editIsActive,
        image_url: finalImageUrl,
      };

      const res = await productService.updateProduct(selectedProduct._id, payload);
      const updatedData = res.data || res;

      // Actualizar estado reactivo local con la confirmación de MongoDB
      setProducts((prev) =>
        prev.map((p) => {
          if (p._id === selectedProduct._id) {
            return {
              ...p,
              price: Number(updatedData.price ?? numericPrice),
              basePrice: Number(updatedData.basePrice ?? numericPrice),
              stock: Number(updatedData.stock ?? numericStock),
              isActive: updatedData.isActive !== undefined ? Boolean(updatedData.isActive) : editIsActive,
              previewImage: finalImageUrl,
              image_url: finalImageUrl,
            };
          }
          return p;
        })
      );

      setSaveSuccess(true);
      showToast(`"${selectedProduct.shortName}" actualizado con éxito en la base de datos.`);

      setTimeout(() => {
        handleCloseModal();
      }, 700);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      setModalError(err.message || 'Error al persistir cambios en el backend.');
    } finally {
      setSaving(false);
    }
  };

  // 4. Conmutar estado activo rápidamente
  const handleToggleActiveQuick = async (e, product) => {
    e.stopPropagation();
    const newStatus = !product.isActive;

    try {
      await productService.updateProduct(product._id, { isActive: newStatus });
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, isActive: newStatus } : p))
      );
      showToast(
        `"${product.shortName}" ahora está ${newStatus ? 'visible' : 'oculto'} en el catálogo.`
      );
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      showToast('No se pudo cambiar el estado. Revisa tu conexión.', 'error');
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.shortName && p.shortName.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const metrics = useMemo(() => {
    const totalUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    const totalValue = products.reduce((acc, p) => acc + (p.price || 0) * (p.stock || 0), 0);
    const lowStockCount = products.filter((p) => (p.stock || 0) <= 5).length;
    const activeCount = products.filter((p) => p.isActive).length;
    return {
      totalModels: products.length,
      activeCount,
      totalUnits,
      totalValue,
      lowStockCount,
    };
  }, [products]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStockBadge = (stock) => {
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
      
      {/* 1. SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-[#201610] text-white z-40 flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out border-r border-[#2d2018] shadow-2xl md:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-8">
          <div className="flex items-center justify-between pt-2">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-light tracking-widest text-white group-hover:text-cirqa-arena transition-colors">
                CIRQA
              </span>
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] bg-white/10 text-cirqa-arena px-2 py-0.5 rounded-full border border-white/10">
                ADMIN
              </span>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10"
              aria-label="Cerrar Menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-1">
            <p className="text-[11px] font-light text-white/50 tracking-wider uppercase">
              Panel de Arquitectura Óptica
            </p>
          </div>

          <nav className="space-y-2">
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
                <span>Inventario MongoDB</span>
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
                <span>Órdenes (Próximamente)</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-semibold bg-cirqa-arena/20 text-cirqa-arena px-2 py-0.5 rounded-full border border-cirqa-arena/30">
                Próximamente
              </span>
            </button>
          </nav>
        </div>

        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="px-2">
            <div className="flex items-center gap-2 text-xs font-medium text-white/90">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="truncate">{admin?.email || 'Admin Producción'}</span>
            </div>
            <p className="text-[10px] text-white/40 font-light mt-0.5 pl-6">JWT Autenticado</p>
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

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* 2. ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
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

        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-cirqa-primario">
                  PANEL PRIVADO DE CONTROL
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-cirqa-negro/40 tracking-wider">
                  Producción: api.cirqa.com.ar
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-cirqa-negro">
                {activeTab === 'inventory' ? 'Gestión de Inventario' : 'Órdenes de Compra'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchInventory}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-cirqa-negro/10 text-cirqa-negro/70 hover:text-cirqa-negro hover:border-cirqa-negro/25 text-xs font-medium transition-all shadow-sm disabled:opacity-50"
                title="Sincronizar con MongoDB"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cirqa-primario' : ''}`} />
                <span>Sincronizar</span>
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

          {errorStatus && (
            <div className="p-4 rounded-3xl bg-cirqa-carmin/5 border border-cirqa-carmin/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-cirqa-carmin">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">Error al conectar con la base de datos:</span>
                  <span>{errorStatus}</span>
                </div>
              </div>
              <button
                onClick={fetchInventory}
                className="px-4 py-2 rounded-xl bg-cirqa-carmin text-white text-xs font-medium hover:bg-cirqa-primario transition-colors flex-shrink-0"
              >
                Reintentar
              </button>
            </div>
          )}

          {activeTab === 'inventory' && (
            <>
              {/* Tarjetas de Métricas */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-3xl p-6 border border-cirqa-negro/5 shadow-sm">
                  <div className="flex items-center justify-between text-cirqa-negro/40 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Modelos Registrados</span>
                    <Glasses className="w-4 h-4 text-cirqa-arena" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-light text-cirqa-negro">
                    {metrics.totalModels}
                  </div>
                  <p className="text-[11px] text-cirqa-negro/50 font-light mt-1">
                    {metrics.activeCount} activos en tienda
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-cirqa-negro/5 shadow-sm">
                  <div className="flex items-center justify-between text-cirqa-negro/40 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Stock Total</span>
                    <Package className="w-4 h-4 text-cirqa-primario" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-light text-cirqa-negro">
                    {metrics.totalUnits}
                  </div>
                  <p className="text-[11px] text-cirqa-negro/50 font-light mt-1">
                    Piezas físicas disponibles
                  </p>
                </div>

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

              {/* Filtro y Búsqueda */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-cirqa-negro/5 shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-cirqa-negro/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por código o modelo (ej. Q1, Aviator)..."
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
                  <span>Mostrando {filteredProducts.length} de {products.length} productos en base de datos</span>
                </div>
              </div>

              {/* TABLA DE PRODUCTOS */}
              <div className="bg-white rounded-3xl border border-cirqa-negro/10 shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 px-6 py-4 bg-[#FBFBFA] border-b border-cirqa-negro/10 text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60 select-none">
                  <div className="col-span-2">Código</div>
                  <div className="col-span-4">Producto</div>
                  <div className="col-span-2">Precio</div>
                  <div className="col-span-2">Stock</div>
                  <div className="col-span-2 text-right">Estado / Acciones</div>
                </div>

                {loading && products.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-cirqa-primario mx-auto" />
                    <p className="text-xs text-cirqa-negro/60 font-light">
                      Cargando catálogo directamente desde MongoDB...
                    </p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <Package className="w-8 h-8 text-cirqa-negro/20 mx-auto" />
                    <p className="text-sm font-medium text-cirqa-negro/70">No se encontraron productos coincidentes</p>
                    <p className="text-xs text-cirqa-negro/40 font-light">Prueba ajustando el filtro de búsqueda.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-cirqa-negro/5">
                    {filteredProducts.map((product) => {
                      const displayImg = formatMediaUrl(product.previewImage);
                      return (
                        <motion.div
                          key={product._id}
                          onClick={() => handleOpenEdit(product)}
                          whileHover={{ backgroundColor: 'rgba(251, 249, 246, 0.9)' }}
                          transition={{ duration: 0.15 }}
                          className="grid grid-cols-12 px-6 py-4 items-center cursor-pointer group transition-colors select-none"
                        >
                          <div className="col-span-2 flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-cirqa-negro group-hover:text-cirqa-primario transition-colors truncate">
                              {product.code}
                            </span>
                          </div>

                          <div className="col-span-4 flex items-center gap-3 pr-2">
                            <div className="w-10 h-10 rounded-xl bg-[#F4EFEA] overflow-hidden flex-shrink-0 flex items-center justify-center border border-cirqa-negro/5">
                              {displayImg ? (
                                <img
                                  src={displayImg}
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

                          <div className="col-span-2">
                            <span className="text-xs font-medium text-cirqa-negro font-mono">
                              {formatMoney(product.price)}
                            </span>
                          </div>

                          <div className="col-span-2 flex items-center gap-2">
                            <span className="text-xs font-semibold text-cirqa-negro font-mono">
                              {product.stock}
                            </span>
                            <span className="text-[10px] text-cirqa-negro/40 font-light hidden sm:inline">
                              uds.
                            </span>
                            <div className="ml-1">
                              {getStockBadge(product.stock)}
                            </div>
                          </div>

                          <div className="col-span-2 flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={(e) => handleToggleActiveQuick(e, product)}
                              title={product.isActive ? 'Producto visible (clic para ocultar)' : 'Producto oculto (clic para activar)'}
                              className={`p-1 rounded-lg transition-colors ${
                                product.isActive
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-cirqa-negro/30 hover:bg-black/5'
                              }`}
                            >
                              {product.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-black/5 text-cirqa-primario">
                              <Edit3 className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                <div className="px-6 py-3.5 bg-[#FBFBFA]/60 border-t border-cirqa-negro/5 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-cirqa-negro/50 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Conectado en vivo con MongoDB. Los cambios modifican la tienda en tiempo real.</span>
                  </div>
                  <span className="font-mono text-[10px]">CIRQA ENGINE · API PRODUCCIÓN</span>
                </div>
              </div>
            </>
          )}

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
                  La integración directa con Mercado Pago se encuentra en sincronización. Las compras generadas en la tienda pública se registrarán automáticamente aquí.
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

      {/* 4. MODAL DE EDICIÓN CON ÁREA DE CARGA DE IMÁGENES */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/40 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 28,
              }}
              className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-3xl p-6 sm:p-8 text-cirqa-negro overflow-hidden z-10 my-8 max-h-[90vh] overflow-y-auto"
            >
              
              <button
                onClick={handleCloseModal}
                disabled={saving || uploadingImage}
                className="absolute top-6 right-6 p-2 rounded-full text-cirqa-negro/40 hover:text-cirqa-negro hover:bg-black/5 transition-all"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Encabezado del Producto */}
              <div className="flex items-center gap-4 pb-5 border-b border-cirqa-negro/10">
                <div className="w-16 h-16 rounded-2xl bg-[#F4EFEA] border border-cirqa-negro/5 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {previewImageBlob || selectedProduct.previewImage ? (
                    <img
                      src={previewImageBlob || formatMediaUrl(selectedProduct.previewImage)}
                      alt={selectedProduct.shortName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Glasses className="w-8 h-8 text-cirqa-negro/30" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-cirqa-primario font-semibold block">
                    ID: {selectedProduct._id}
                  </span>
                  <h3 className="text-xl font-light tracking-tight text-cirqa-negro">
                    {selectedProduct.shortName}
                  </h3>
                  <p className="text-xs text-cirqa-negro/50 font-light">
                    {selectedProduct.title}
                  </p>
                </div>
              </div>

              {/* SECCIÓN DE CARGA Y GESTIÓN DE IMAGEN */}
              <div className="mt-5 p-4 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-cirqa-primario" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-cirqa-negro/80">
                      Imagen del Producto
                    </span>
                  </div>
                  {uploadSuccess && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> ¡Imagen sincronizada!
                    </span>
                  )}
                </div>

                {/* Input de archivo oculto con botón estético Apple */}
                <input
                  ref={fileInputRef}
                  type="file"
                  id="product-image-upload-input"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Vista previa o dropzone */}
                {selectedImageFile && previewImageBlob ? (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-cirqa-negro/10">
                    <div className="w-14 h-14 rounded-lg bg-[#F4EFEA] border border-cirqa-negro/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img
                        src={previewImageBlob}
                        alt="Vista previa seleccionada"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-cirqa-negro truncate">
                        {selectedImageFile.name}
                      </p>
                      <p className="text-[10px] text-cirqa-negro/40 font-mono">
                        {(selectedImageFile.size / 1024).toFixed(1)} KB · Nueva imagen lista
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={clearTemporaryImage}
                        disabled={uploadingImage}
                        className="p-1.5 text-cirqa-negro/40 hover:text-cirqa-carmin hover:bg-cirqa-carmin/10 rounded-lg transition-colors"
                        title="Descartar imagen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleUploadImageOnly}
                        disabled={uploadingImage}
                        className="px-3 py-1.5 bg-cirqa-primario hover:bg-cirqa-negro text-white text-[11px] font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {uploadingImage ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Subiendo...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Subir Ahora</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-cirqa-negro/15 hover:border-cirqa-primario/60 bg-white/70 hover:bg-white rounded-2xl p-4 text-center cursor-pointer transition-all group"
                  >
                    <UploadCloud className="w-6 h-6 text-cirqa-negro/35 group-hover:text-cirqa-primario mx-auto mb-1.5 transition-colors" />
                    <p className="text-xs font-medium text-cirqa-negro/80">
                      Haz clic para cambiar la imagen
                    </p>
                    <p className="text-[10px] text-cirqa-negro/40 mt-0.5">
                      Archivos soportados: JPG, PNG, WEBP o AVIF (máx. 10 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Mensaje de Error en Modal */}
              {modalError && (
                <div className="mt-4 p-3.5 rounded-2xl bg-[#AC1917]/10 border border-[#AC1917]/20 text-[#AC1917] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Formulario de Propiedades */}
              <form onSubmit={handleSaveProduct} className="mt-5 space-y-5">
                
                {/* Input Precio */}
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
                      className="w-full pl-6 pr-4 py-2.5 border-b border-cirqa-negro/20 bg-transparent focus:border-cirqa-primario focus:outline-none text-base font-mono text-cirqa-negro transition-colors"
                    />
                  </div>
                </div>

                {/* Input Stock */}
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
                      className="w-full pr-16 py-2.5 border-b border-cirqa-negro/20 bg-transparent focus:border-cirqa-primario focus:outline-none text-base font-mono text-cirqa-negro transition-colors"
                    />
                    <span className="absolute right-0 text-xs text-cirqa-negro/40 font-light">
                      unidades
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-cirqa-negro/40">
                      Estado:
                    </span>
                    <div>
                      {getStockBadge(Number(editStock) || 0)}
                    </div>
                  </div>
                </div>

                {/* Toggle Visibilidad */}
                <div className="flex items-center justify-between p-3.5 bg-cirqa-surface rounded-2xl border border-cirqa-negro/5">
                  <div>
                    <span className="text-xs font-semibold text-cirqa-negro block">
                      Visibilidad en el Catálogo
                    </span>
                    <span className="text-[11px] text-cirqa-negro/50 font-light">
                      {editIsActive ? 'Visible para clientes en la tienda pública' : 'Oculto al público en la tienda'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(!editIsActive)}
                    className="text-cirqa-primario hover:opacity-80 transition-opacity p-1"
                  >
                    {editIsActive ? (
                      <ToggleRight className="w-7 h-7 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-cirqa-negro/30" />
                    )}
                  </button>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-500/10 flex items-center gap-2.5 text-[11px] text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Conexión protegida mediante Bearer JWT con el VPS en producción.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={saving || uploadingImage}
                    className="px-5 py-3 rounded-full text-xs font-medium text-cirqa-negro/70 hover:text-cirqa-negro hover:bg-black/5 transition-all"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving || uploadingImage}
                    className="px-7 py-3 rounded-full bg-cirqa-negro hover:bg-cirqa-primario active:scale-[0.98] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando en MongoDB...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>¡Guardado!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Actualizar en Producción</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white shadow-2xl border text-xs font-medium ${
              toast.type === 'error'
                ? 'bg-[#AC1917] border-white/20'
                : 'bg-cirqa-negro border-white/10'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
