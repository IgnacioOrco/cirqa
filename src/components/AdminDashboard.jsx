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
  Plus,
  Star,
  ChevronUp,
  ChevronDown,
  Layers,
  Tag,
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

// Etiquetas legibles para los roles o ubicaciones de fotos
export const IMAGE_TAG_OPTIONS = [
  { value: 'front', label: 'Frontal (Cara)' },
  { value: 'side', label: 'Perfil / Lateral' },
  { value: 'angle', label: 'Ángulo 45°' },
  { value: 'model', label: 'Puesta en Modelo' },
  { value: 'detail', label: 'Detalle Técnico / Bisagra' },
  { value: 'gallery', label: 'Galería General' },
];

export default function AdminDashboard({ authToken: propToken, onLogout: propOnLogout }) {
  const navigate = useNavigate();

  // Referencias a inputs de archivos
  const galleryFileInputRef = useRef(null);

  // Estados de autenticación
  const [admin, setAdmin] = useState(() => authService.getAdmin());

  // Navegación interna del panel
  const [activeTab, setActiveTab] = useState('inventory');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Catálogo de productos (MongoDB)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // =========================================================================
  // 1. CARGA DE CATÁLOGO DESDE MONGODB
  // =========================================================================
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

      const mapped = data.map((item) => {
        let primaryImgUrl = item.image_url;
        let imagesList = [];

        if (Array.isArray(item.images) && item.images.length > 0) {
          imagesList = item.images.map((img, idx) => {
            if (typeof img === 'string') {
              return {
                _id: `img-${idx}`,
                url: img,
                tag: idx === 0 ? 'front' : 'gallery',
                isPrimary: idx === 0,
                order: idx,
              };
            }
            return {
              _id: img._id || `img-${idx}`,
              url: img.url,
              tag: img.tag || 'gallery',
              isPrimary: Boolean(img.isPrimary),
              order: img.order !== undefined ? Number(img.order) : idx,
            };
          });

          const primaryObj = imagesList.find((i) => i.isPrimary) || imagesList[0];
          if (primaryObj) primaryImgUrl = primaryObj.url;
        }

        const modelCode = item.modelCode || `Q-${(item.slug || item.name || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || '001'}`;

        return {
          _id: item._id,
          modelCode,
          code: modelCode,
          slug: item.slug || item._id,
          name: item.name,
          shortName: item.name,
          title: item.description || 'Armazón Espectral CIRQA',
          description: item.description || '',
          price: Number(item.price ?? item.basePrice ?? 0),
          basePrice: Number(item.basePrice ?? item.price ?? 0),
          stock: Number(item.stock ?? 0),
          previewImage: primaryImgUrl || '/products/_DSC8649.webp',
          image_url: primaryImgUrl || '',
          images: imagesList,
          isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        };
      });

      const sorted = [...mapped].sort((a, b) => {
        const slugA = (a.slug || a._id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const slugB = (b.slug || b._id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const orderA = MODEL_SORT_ORDER[slugA] ?? 99;
        const orderB = MODEL_SORT_ORDER[slugB] ?? 99;
        return orderA - orderB;
      });

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

  // =========================================================================
  // 2. MODAL DE CREACIÓN DE NUEVO PRODUCTO
  // =========================================================================
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createModelCode, setCreateModelCode] = useState('');
  const [createPrice, setCreatePrice] = useState('');
  const [createStock, setCreateStock] = useState('10');
  const [createDescription, setCreateDescription] = useState('');
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  const resetCreateForm = () => {
    setCreateName('');
    setCreateModelCode('');
    setCreatePrice('');
    setCreateStock('10');
    setCreateDescription('');
    setCreateIsActive(true);
    setCreateError(null);
  };

  const handleOpenCreateModal = () => {
    resetCreateForm();
    setCreateModalOpen(true);
  };

  const handleCreateProductSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);

    const priceNum = Number(createPrice);
    const stockNum = Number(createStock);

    if (!createName.trim()) {
      setCreateError('El nombre del producto es obligatorio.');
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      setCreateError('Ingresa un precio válido mayor o igual a 0.');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      setCreateError('El stock debe ser un número entero mayor o igual a 0.');
      return;
    }

    setCreateLoading(true);

    try {
      const payload = {
        name: createName.trim(),
        modelCode: createModelCode.trim().toUpperCase() || undefined,
        price: priceNum,
        basePrice: priceNum,
        stock: stockNum,
        description: createDescription.trim(),
        isActive: createIsActive,
      };

      const res = await productService.createProduct(payload);
      const newProd = res.data || res;

      showToast(`Producto "${newProd.name}" creado con éxito.`);
      setCreateModalOpen(false);
      resetCreateForm();
      // Recargar catálogo para tener el producto con todos los defaults de Mongo
      await fetchInventory();
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      setCreateError(err.message || 'No fue posible crear el producto.');
    } finally {
      setCreateLoading(false);
    }
  };

  // =========================================================================
  // 3. MODAL DE EDICIÓN & GESTIÓN DE GALERÍA
  // =========================================================================
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editDescription, setEditDescription] = useState('');
  const [editModelCode, setEditModelCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Estados de subida múltiple a la galería
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([]);
  const [selectedGalleryTag, setSelectedGalleryTag] = useState('gallery');
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // Limpiar previews temporales de subida
  const clearGalleryUploadSelection = () => {
    galleryPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    setGalleryPreviews([]);
    setSelectedGalleryFiles([]);
    if (galleryFileInputRef.current) {
      galleryFileInputRef.current.value = '';
    }
  };

  // Abrir modal de edición
  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setEditPrice(String(product.price));
    setEditStock(String(product.stock));
    setEditIsActive(product.isActive !== false);
    setEditDescription(product.description || '');
    setEditModelCode(product.modelCode || product.code || '');
    setModalError(null);
    setSaveSuccess(false);
    clearGalleryUploadSelection();
  };

  // Cerrar modal
  const handleCloseModal = () => {
    if (saving || uploadingGallery) return;
    clearGalleryUploadSelection();
    setSelectedProduct(null);
    setModalError(null);
    setSaveSuccess(false);
  };

  // Selección de múltiples archivos para la galería
  const handleGalleryFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > 5) {
      setModalError('Puedes subir un máximo de 5 fotos por vez.');
      return;
    }

    // Validar formato y tamaño
    for (const f of files) {
      if (!f.type.startsWith('image/')) {
        setModalError(`El archivo "${f.name}" no es una imagen válida.`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setModalError(`"${f.name}" supera el límite de 10 MB.`);
        return;
      }
    }

    // Crear previews
    const newPreviews = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
      size: (f.size / 1024).toFixed(0),
    }));

    setGalleryPreviews(newPreviews);
    setSelectedGalleryFiles(files);
    setModalError(null);
  };

  // Ejecutar subida de las fotos seleccionadas a la galería
  const handleUploadGalleryPhotos = async () => {
    if (selectedGalleryFiles.length === 0 || !selectedProduct) return;

    setUploadingGallery(true);
    setModalError(null);

    try {
      const res = await productService.uploadProductImages(
        selectedProduct._id,
        selectedGalleryFiles,
        selectedGalleryTag
      );

      const updatedProduct = res.data;
      if (!updatedProduct) throw new Error('Respuesta inválida del servidor.');

      // Extraer imágenes actualizadas
      const updatedImages = (updatedProduct.images || []).map((img, idx) => ({
        _id: img._id,
        url: img.url,
        tag: img.tag || 'gallery',
        isPrimary: Boolean(img.isPrimary),
        order: img.order !== undefined ? img.order : idx,
      }));

      const primary = updatedImages.find((img) => img.isPrimary) || updatedImages[0];
      const newPreview = primary?.url || updatedProduct.image_url;

      // Actualizar producto seleccionado
      setSelectedProduct((prev) => ({
        ...prev,
        images: updatedImages,
        previewImage: newPreview,
        image_url: newPreview,
      }));

      // Actualizar estado global reactivo
      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, images: updatedImages, previewImage: newPreview, image_url: newPreview }
            : p
        )
      );

      clearGalleryUploadSelection();
      showToast(`${selectedGalleryFiles.length} foto(s) añadidas a la galería con éxito.`);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      setModalError(err.message || 'Error al subir fotos a la galería.');
    } finally {
      setUploadingGallery(false);
    }
  };

  // Marcar una imagen puntual como portada / primaria
  const handleSetPrimaryImage = async (imageId) => {
    if (!selectedProduct) return;

    try {
      await productService.updateProductImageMetadata(selectedProduct._id, imageId, {
        isPrimary: true,
      });

      const updatedImages = selectedProduct.images.map((img) => ({
        ...img,
        isPrimary: img._id === imageId,
      }));

      const primary = updatedImages.find((i) => i.isPrimary) || updatedImages[0];
      const newPreview = primary?.url || selectedProduct.previewImage;

      setSelectedProduct((prev) => ({
        ...prev,
        images: updatedImages,
        previewImage: newPreview,
        image_url: newPreview,
      }));

      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, images: updatedImages, previewImage: newPreview, image_url: newPreview }
            : p
        )
      );

      showToast('Foto de portada actualizada exitosamente.');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      showToast('Error al actualizar la foto de portada.', 'error');
    }
  };

  // Modificar el tag (rol/ubicación) de una foto existente
  const handleUpdateImageTag = async (imageId, newTag) => {
    if (!selectedProduct) return;

    try {
      await productService.updateProductImageMetadata(selectedProduct._id, imageId, {
        tag: newTag,
      });

      const updatedImages = selectedProduct.images.map((img) =>
        img._id === imageId ? { ...img, tag: newTag } : img
      );

      setSelectedProduct((prev) => ({ ...prev, images: updatedImages }));
      setProducts((prev) =>
        prev.map((p) => (p._id === selectedProduct._id ? { ...p, images: updatedImages } : p))
      );

      showToast('Categoría de imagen actualizada.');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      showToast('Error al actualizar la categoría.', 'error');
    }
  };

  // Eliminar foto puntual de la galería y del disco
  const handleDeleteImage = async (imageId) => {
    if (!selectedProduct) return;

    const confirmDelete = window.confirm(
      '¿Estás seguro de que deseas eliminar permanentemente esta foto del producto y del servidor?'
    );
    if (!confirmDelete) return;

    try {
      const res = await productService.deleteProductImage(selectedProduct._id, imageId);
      const updatedProduct = res.data;

      const updatedImages = (updatedProduct.images || []).map((img, idx) => ({
        _id: img._id,
        url: img.url,
        tag: img.tag || 'gallery',
        isPrimary: Boolean(img.isPrimary),
        order: img.order !== undefined ? img.order : idx,
      }));

      const primary = updatedImages.find((img) => img.isPrimary) || updatedImages[0];
      const newPreview = primary?.url || updatedProduct.image_url;

      setSelectedProduct((prev) => ({
        ...prev,
        images: updatedImages,
        previewImage: newPreview,
        image_url: newPreview,
      }));

      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, images: updatedImages, previewImage: newPreview, image_url: newPreview }
            : p
        )
      );

      showToast('Foto eliminada del catálogo y del disco.');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      showToast('No fue posible eliminar la foto.', 'error');
    }
  };

  // Reordenar imágenes (Mover arriba / abajo)
  const handleReorderImage = async (currentIndex, direction) => {
    if (!selectedProduct) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= selectedProduct.images.length) return;

    const newImages = [...selectedProduct.images];
    const [movedItem] = newImages.splice(currentIndex, 1);
    newImages.splice(targetIndex, 0, movedItem);

    // Reasignar order consecutivo
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      order: idx,
    }));

    setSelectedProduct((prev) => ({ ...prev, images: reorderedImages }));

    try {
      // Persistir reordenamiento en backend
      await productService.updateProduct(selectedProduct._id, {
        images: reorderedImages,
      });

      setProducts((prev) =>
        prev.map((p) => (p._id === selectedProduct._id ? { ...p, images: reorderedImages } : p))
      );
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      showToast('Error al persistir el nuevo orden de imágenes.', 'error');
    }
  };

  // Guardar datos generales del producto (PUT /api/products/:id)
  const handleSaveProductGeneral = async (e) => {
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
      const payload = {
        modelCode: editModelCode.trim().toUpperCase() || undefined,
        price: numericPrice,
        basePrice: numericPrice,
        stock: numericStock,
        description: editDescription.trim(),
        isActive: editIsActive,
      };

      const res = await productService.updateProduct(selectedProduct._id, payload);
      const updatedData = res.data || res;

      setProducts((prev) =>
        prev.map((p) => {
          if (p._id === selectedProduct._id) {
            return {
              ...p,
              modelCode: updatedData.modelCode || p.modelCode,
              code: updatedData.modelCode || p.code,
              price: Number(updatedData.price ?? numericPrice),
              basePrice: Number(updatedData.basePrice ?? numericPrice),
              stock: Number(updatedData.stock ?? numericStock),
              description: updatedData.description ?? editDescription,
              title: updatedData.description ?? p.title,
              isActive: updatedData.isActive !== undefined ? Boolean(updatedData.isActive) : editIsActive,
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

  // Conmutador rápido de visibilidad desde la tabla
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

  // =========================================================================
  // 4. FILTROS & MÉTRICAS
  // =========================================================================
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.modelCode && p.modelCode.toLowerCase().includes(q)) ||
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
          
          {/* Header Superior del Dashboard */}
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

            <div className="flex items-center gap-3 flex-wrap">
              {/* Botón de Creación de Producto */}
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cirqa-primario hover:bg-cirqa-negro text-white text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>

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
              {/* Métricas */}
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
                    placeholder="Filtrar por código o modelo (ej. Q-001, Aviator)..."
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
                  <span>Mostrando {filteredProducts.length} de {products.length} productos</span>
                </div>
              </div>

              {/* TABLA DE PRODUCTOS */}
              <div className="bg-white rounded-3xl border border-cirqa-negro/10 shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 px-6 py-4 bg-[#FBFBFA] border-b border-cirqa-negro/10 text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60 select-none">
                  <div className="col-span-2">Código</div>
                  <div className="col-span-4">Producto & Galería</div>
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
                      const imageCount = Array.isArray(product.images) ? product.images.length : (product.previewImage ? 1 : 0);

                      return (
                        <motion.div
                          key={product._id}
                          onClick={() => handleOpenEdit(product)}
                          whileHover={{ backgroundColor: 'rgba(251, 249, 246, 0.9)' }}
                          transition={{ duration: 0.15 }}
                          className="grid grid-cols-12 px-6 py-4 items-center cursor-pointer group transition-colors select-none"
                        >
                          {/* Columna 1: Código */}
                          <div className="col-span-2 flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-cirqa-negro group-hover:text-cirqa-primario transition-colors truncate">
                              {product.modelCode || product.code}
                            </span>
                          </div>

                          {/* Columna 2: Nombre, Miniatura & Conteo de Galería */}
                          <div className="col-span-4 flex items-center gap-3 pr-2">
                            <div className="relative w-12 h-12 rounded-xl bg-[#F4EFEA] overflow-hidden flex-shrink-0 flex items-center justify-center border border-cirqa-negro/5">
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
                              <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-mono px-1 rounded-sm">
                                {imageCount}
                              </span>
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
                          <div className="col-span-2">
                            <span className="text-xs font-medium text-cirqa-negro font-mono">
                              {formatMoney(product.price)}
                            </span>
                          </div>

                          {/* Columna 4: Stock */}
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

                          {/* Columna 5: Estado / Acciones */}
                          <div className="col-span-2 flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={(e) => handleToggleActiveQuick(e, product)}
                              title={product.isActive ? 'Producto visible (clic para ocultar)' : 'Producto oculto (clic para activar)'}
                              className={`p-1.5 rounded-lg transition-colors ${
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

      {/* ========================================================================= */}
      {/* MODAL 1: CREAR NUEVO PRODUCTO                                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !createLoading && setCreateModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-3xl p-6 sm:p-8 text-cirqa-negro overflow-hidden z-10 my-8 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => !createLoading && setCreateModalOpen(false)}
                disabled={createLoading}
                className="absolute top-6 right-6 p-2 rounded-full text-cirqa-negro/40 hover:text-cirqa-negro hover:bg-black/5 transition-all"
                aria-label="Cerrar modal de creación"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="pb-5 border-b border-cirqa-negro/10">
                <span className="text-[10px] uppercase font-mono tracking-wider text-cirqa-primario font-semibold block mb-1">
                  CATÁLOGO CIRQA
                </span>
                <h3 className="text-xl font-light tracking-tight text-cirqa-negro">
                  Crear Nuevo Producto
                </h3>
                <p className="text-xs text-cirqa-negro/50 font-light mt-0.5">
                  Registra un nuevo modelo con código único y stock en MongoDB.
                </p>
              </div>

              {createError && (
                <div className="mt-4 p-3.5 rounded-2xl bg-[#AC1917]/10 border border-[#AC1917]/20 text-[#AC1917] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateProductSubmit} className="mt-5 space-y-4">
                {/* Nombre */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70 block mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. CIRQA Q-006 · Solsticio"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-cirqa-negro/15 bg-white text-xs text-cirqa-negro focus:outline-none focus:border-cirqa-primario transition-all"
                  />
                </div>

                {/* Código de Modelo */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70 block mb-1">
                      Código de Modelo *
                    </label>
                    <input
                      type="text"
                      placeholder="Q-006"
                      value={createModelCode}
                      onChange={(e) => setCreateModelCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-cirqa-negro/15 bg-white text-xs font-mono uppercase text-cirqa-negro focus:outline-none focus:border-cirqa-primario transition-all"
                    />
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70 block mb-1">
                      Precio ($ ARS) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      placeholder="42000"
                      value={createPrice}
                      onChange={(e) => setCreatePrice(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-cirqa-negro/15 bg-white text-xs font-mono text-cirqa-negro focus:outline-none focus:border-cirqa-primario transition-all"
                    />
                  </div>
                </div>

                {/* Stock y Visibilidad */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70 block mb-1">
                      Stock Inicial *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={createStock}
                      onChange={(e) => setCreateStock(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-cirqa-negro/15 bg-white text-xs font-mono text-cirqa-negro focus:outline-none focus:border-cirqa-primario transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70 block mb-1">
                      Visibilidad
                    </label>
                    <button
                      type="button"
                      onClick={() => setCreateIsActive(!createIsActive)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-cirqa-negro/15 bg-white text-xs text-cirqa-negro hover:bg-black/5 transition-all"
                    >
                      <span className="text-[11px]">{createIsActive ? 'Visible en tienda' : 'Oculto'}</span>
                      {createIsActive ? (
                        <ToggleRight className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-cirqa-negro/30" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70 block mb-1">
                    Descripción Técnica / Óptica
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Lentes espectrales de ingeniería biomimética..."
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-cirqa-negro/15 bg-white text-xs text-cirqa-negro focus:outline-none focus:border-cirqa-primario transition-all resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    disabled={createLoading}
                    className="px-5 py-2.5 rounded-full text-xs font-medium text-cirqa-negro/70 hover:text-cirqa-negro hover:bg-black/5 transition-all"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-6 py-2.5 rounded-full bg-cirqa-primario hover:bg-cirqa-negro text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {createLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creando...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Guardar Producto</span>
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
      {/* MODAL 2: EDICIÓN DE PRODUCTO & GESTIÓN DE GALERÍA CLASIFICADA             */}
      {/* ========================================================================= */}
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
              className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-3xl p-6 sm:p-8 text-cirqa-negro overflow-hidden z-10 my-8 max-h-[92vh] overflow-y-auto"
            >
              
              <button
                onClick={handleCloseModal}
                disabled={saving || uploadingGallery}
                className="absolute top-6 right-6 p-2 rounded-full text-cirqa-negro/40 hover:text-cirqa-negro hover:bg-black/5 transition-all"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Encabezado del Producto */}
              <div className="flex items-center gap-4 pb-5 border-b border-cirqa-negro/10">
                <div className="w-16 h-16 rounded-2xl bg-[#F4EFEA] border border-cirqa-negro/5 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={formatMediaUrl(selectedProduct.previewImage)}
                    alt={selectedProduct.shortName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-cirqa-primario font-semibold">
                      {selectedProduct.modelCode || selectedProduct.code}
                    </span>
                    <span className="text-[10px] text-cirqa-negro/30 font-mono">
                      (ID: {selectedProduct._id})
                    </span>
                  </div>
                  <h3 className="text-xl font-light tracking-tight text-cirqa-negro">
                    {selectedProduct.shortName}
                  </h3>
                  <p className="text-xs text-cirqa-negro/50 font-light truncate max-w-md">
                    {selectedProduct.description || selectedProduct.title}
                  </p>
                </div>
              </div>

              {/* SECCIÓN INTERACTIVA: GESTIÓN DE GALERÍA CLASIFICADA */}
              <div className="mt-5 p-5 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cirqa-primario" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-cirqa-negro/80">
                      Galería de Fotos Clasificada
                    </span>
                    <span className="text-[10px] font-mono text-cirqa-negro/40 bg-black/5 px-2 py-0.5 rounded-full">
                      {selectedProduct.images?.length || 0} fotos
                    </span>
                  </div>
                  <span className="text-[10px] text-cirqa-negro/50 font-light hidden sm:inline">
                    Marca la estrella para definir la foto de portada
                  </span>
                </div>

                {/* Input file múltiple (hasta 5 fotos simultáneas) */}
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleGalleryFilesChange}
                  className="hidden"
                />

                {/* Dropzone o Previews pendientes de subida */}
                {galleryPreviews.length > 0 ? (
                  <div className="p-3 bg-white rounded-2xl border border-cirqa-negro/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-cirqa-negro">
                        {galleryPreviews.length} foto(s) lista(s) para subir:
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Selector de Tag previo a subir */}
                        <div className="flex items-center gap-1.5 text-xs text-cirqa-negro/60">
                          <Tag className="w-3.5 h-3.5 text-cirqa-primario" />
                          <select
                            value={selectedGalleryTag}
                            onChange={(e) => setSelectedGalleryTag(e.target.value)}
                            className="text-xs bg-[#FBFBFA] border border-cirqa-negro/15 rounded-lg px-2 py-1 font-medium text-cirqa-negro focus:outline-none"
                          >
                            {IMAGE_TAG_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Grilla de previews antes de confirmar */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {galleryPreviews.map((prev, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl bg-[#F4EFEA] border border-cirqa-negro/10 overflow-hidden group">
                          <img src={prev.url} alt={prev.name} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] font-mono px-1 rounded truncate max-w-[90%]">
                            {prev.size} KB
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-cirqa-negro/5">
                      <button
                        type="button"
                        onClick={clearGalleryUploadSelection}
                        disabled={uploadingGallery}
                        className="px-3 py-1.5 text-xs text-cirqa-negro/60 hover:text-cirqa-negro hover:bg-black/5 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleUploadGalleryPhotos}
                        disabled={uploadingGallery}
                        className="px-4 py-1.5 bg-cirqa-primario hover:bg-cirqa-negro text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {uploadingGallery ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Subiendo fotos...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Subir a la Galería</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => galleryFileInputRef.current?.click()}
                    className="border-2 border-dashed border-cirqa-negro/15 hover:border-cirqa-primario/60 bg-white/70 hover:bg-white rounded-2xl p-4 text-center cursor-pointer transition-all group"
                  >
                    <UploadCloud className="w-6 h-6 text-cirqa-negro/35 group-hover:text-cirqa-primario mx-auto mb-1.5 transition-colors" />
                    <p className="text-xs font-medium text-cirqa-negro/80">
                      Haz clic para subir fotos clasificadas a la galería
                    </p>
                    <p className="text-[10px] text-cirqa-negro/40 mt-0.5">
                      Soporta selección múltiple (hasta 5 fotos JPG, PNG, WEBP, AVIF)
                    </p>
                  </div>
                )}

                {/* Grilla visual de fotos existentes en el producto */}
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60 block">
                      Fotos Actuales en MongoDB:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {selectedProduct.images.map((img, idx) => (
                        <div
                          key={img._id || idx}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            img.isPrimary
                              ? 'bg-amber-500/5 border-amber-500/30'
                              : 'bg-white border-cirqa-negro/10'
                          }`}
                        >
                          {/* Miniatura */}
                          <div className="relative w-14 h-14 rounded-lg bg-[#F4EFEA] border border-cirqa-negro/10 overflow-hidden flex-shrink-0">
                            <img
                              src={formatMediaUrl(img.url)}
                              alt={`Foto ${idx + 1}`}
                              className="w-full h-full object-contain"
                            />
                            {img.isPrimary && (
                              <span className="absolute top-0.5 left-0.5 bg-amber-500 text-white p-0.5 rounded-full shadow-sm" title="Foto de Portada">
                                <Star className="w-2.5 h-2.5 fill-current" />
                              </span>
                            )}
                          </div>

                          {/* Opciones por foto: Selector de Tag & Portada */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <select
                                value={img.tag || 'gallery'}
                                onChange={(e) => handleUpdateImageTag(img._id, e.target.value)}
                                className="text-[11px] bg-[#FBFBFA] border border-cirqa-negro/15 rounded-md px-1.5 py-0.5 font-medium text-cirqa-negro focus:outline-none"
                              >
                                {IMAGE_TAG_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>

                              {/* Botón Portada */}
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(img._id)}
                                title={img.isPrimary ? 'Foto de Portada Actual' : 'Establecer como Portada'}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                                  img.isPrimary
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'text-cirqa-negro/40 hover:text-amber-700 hover:bg-amber-50'
                                }`}
                              >
                                <Star className={`w-3 h-3 ${img.isPrimary ? 'fill-current text-amber-500' : ''}`} />
                                <span className="hidden sm:inline">{img.isPrimary ? 'Portada' : 'Hacer Portada'}</span>
                              </button>
                            </div>

                            {/* Controles de orden y eliminación */}
                            <div className="flex items-center justify-between text-[10px] text-cirqa-negro/40 pt-0.5">
                              <span className="font-mono">Pos: #{idx + 1}</span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleReorderImage(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 hover:bg-black/5 rounded disabled:opacity-20"
                                  title="Subir posición"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReorderImage(idx, 'down')}
                                  disabled={idx === selectedProduct.images.length - 1}
                                  className="p-1 hover:bg-black/5 rounded disabled:opacity-20"
                                  title="Bajar posición"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(img._id)}
                                  className="p-1 text-cirqa-carmin hover:bg-cirqa-carmin/10 rounded transition-colors ml-1"
                                  title="Eliminar foto del producto y disco"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

              {/* Formulario de Propiedades Generales */}
              <form onSubmit={handleSaveProductGeneral} className="mt-5 space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Código de Modelo */}
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70 block mb-1">
                      Código de Modelo (modelCode)
                    </label>
                    <input
                      type="text"
                      required
                      value={editModelCode}
                      onChange={(e) => setEditModelCode(e.target.value)}
                      placeholder="Q-001"
                      className="w-full px-4 py-2 border-b border-cirqa-negro/20 bg-transparent focus:border-cirqa-primario focus:outline-none text-sm font-mono text-cirqa-negro uppercase transition-colors"
                    />
                  </div>

                  {/* Precio */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70">
                        Precio ($ ARS)
                      </label>
                      <span className="text-[10px] text-cirqa-negro/40">
                        Actual: {formatMoney(selectedProduct.price)}
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-0 text-xs font-mono text-cirqa-negro/40 font-semibold">$</span>
                      <input
                        type="number"
                        step="100"
                        min="0"
                        required
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="42000"
                        className="w-full pl-5 pr-4 py-2 border-b border-cirqa-negro/20 bg-transparent focus:border-cirqa-primario focus:outline-none text-sm font-mono text-cirqa-negro transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Stock */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70">
                        Stock
                      </label>
                      <span className="text-[10px] text-cirqa-negro/40">
                        {selectedProduct.stock} uds.
                      </span>
                    </div>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      placeholder="10"
                      className="w-full py-2 border-b border-cirqa-negro/20 bg-transparent focus:border-cirqa-primario focus:outline-none text-sm font-mono text-cirqa-negro transition-colors"
                    />
                  </div>

                  {/* Visibilidad */}
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70 block mb-1">
                      Visibilidad en Catálogo
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditIsActive(!editIsActive)}
                      className="w-full flex items-center justify-between py-2 border-b border-cirqa-negro/20 bg-transparent text-xs text-cirqa-negro transition-colors"
                    >
                      <span className="text-xs">{editIsActive ? 'Visible para clientes' : 'Oculto al público'}</span>
                      {editIsActive ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-cirqa-negro/30" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-cirqa-negro/70 block mb-1">
                    Descripción del Modelo
                  </label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descripción óptica y características de ingeniería..."
                    className="w-full px-4 py-2 rounded-xl border border-cirqa-negro/15 bg-white text-xs text-cirqa-negro focus:outline-none focus:border-cirqa-primario transition-all resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-cirqa-negro/10">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={saving || uploadingGallery}
                    className="px-5 py-2.5 rounded-full text-xs font-medium text-cirqa-negro/70 hover:text-cirqa-negro hover:bg-black/5 transition-all"
                  >
                    Cerrar
                  </button>

                  <button
                    type="submit"
                    disabled={saving || uploadingGallery}
                    className="px-7 py-2.5 rounded-full bg-cirqa-negro hover:bg-cirqa-primario active:scale-[0.98] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
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
                        <span>Guardar Cambios</span>
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
      {/* 5. TOAST                                                                  */}
      {/* ========================================================================= */}
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
