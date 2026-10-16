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
  MousePointer,
  ChevronUp,
  ChevronDown,
  Layers,
  Tag,
  Sparkles,
  Percent,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  productService,
  authService,
  handleSessionExpired,
  formatMediaUrl,
} from '../services/api';
import { autoAssignMissingVariantKeys, normalizeVariantKey } from '../utils/productImages';
import OrdersTab from './admin/OrdersTab';
import CouponsTab from './admin/CouponsTab';

export const CANONICAL_VARIANTS = [
  { key: 'clear', name: 'Clear', subtitle: 'USO DIARIO', colorHex: '#CBD5E1', badgeColor: '#CBD5E1' },
  { key: 'dia', name: 'Día', subtitle: 'PANTALLAS · FOCO', colorHex: '#FACC15', badgeColor: '#FACC15' },
  { key: 'transicion', name: 'Transición', subtitle: 'TARDE 17HS · CAÍDA SOLAR', colorHex: '#FB923C', badgeColor: '#FB923C' },
  { key: 'noche', name: 'Noche', subtitle: 'NOCHE 20HS · MELATONINA', colorHex: '#F87171', badgeColor: '#F87171' },
];

const MODEL_SORT_ORDER = {
  q001: 1,
  q002: 2,
  q003: 3,
  q004: 4,
  q005: 5,
};

// Etiquetas legibles para los roles o ubicaciones de fotos
export const IMAGE_TAG_OPTIONS = [
  { value: 'front', label: 'Frente (Principal)' },
  { value: 'angle', label: 'Ángulo / Perfil (Hover)' },
  { value: 'side', label: 'Lateral' },
  { value: 'model', label: 'Modelo / Lifestyle' },
  { value: 'gallery', label: 'Galería General' },
  { value: 'detail', label: 'Detalle Técnico' },
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
  const [ordersCount, setOrdersCount] = useState(0);

  // Catálogo de productos (MongoDB)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Notificación Toast flotante
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

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
          const sortedRaw = [...item.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          imagesList = sortedRaw.map((img, idx) => {
            if (typeof img === 'string') {
              return {
                _id: `img-${idx}`,
                url: img,
                tag: idx === 0 ? 'front' : 'gallery',
                variantKey: null,
                isPrimary: idx === 0,
                order: idx,
              };
            }
            return {
              _id: img._id || `img-${idx}`,
              url: img.url,
              tag: img.tag || 'gallery',
              variantKey: img.variantKey || null,
              isPrimary: Boolean(img.isPrimary),
              order: img.order !== undefined ? Number(img.order) : idx,
            };
          });

          imagesList.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          imagesList = autoAssignMissingVariantKeys(imagesList);

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
          hasVariants: Boolean(item.hasVariants),
          variantAxisTitle: item.variantAxisTitle || 'Seleccionar Variante',
          variants: Array.isArray(item.variants) ? item.variants : [],
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
  const [editHasVariants, setEditHasVariants] = useState(false);
  const [editVariantAxisTitle, setEditVariantAxisTitle] = useState('Seleccionar Variante');
  const [editVariants, setEditVariants] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Estados para edición rápida en grilla (Precio y Stock)
  const [editingCell, setEditingCell] = useState(null); // { productId: string, field: 'price' | 'stock' }
  const [cellDraftValue, setCellDraftValue] = useState('');
  const [savingCellId, setSavingCellId] = useState(null);
  const [flashSavedCell, setFlashSavedCell] = useState(null);

  // Drag & drop de fotos entre columnas de variantes
  const [draggedImageId, setDraggedImageId] = useState(null);

  // Estados de subida múltiple a la galería
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([]);
  const [selectedGalleryTag, setSelectedGalleryTag] = useState('gallery');
  const [selectedGalleryVariantKey, setSelectedGalleryVariantKey] = useState('');
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // Referencia para subida directa por columna
  const columnFileInputRef = useRef(null);
  const directUploadInputRef = useRef(null);
  const [directUploadTarget, setDirectUploadTarget] = useState({ variantKey: null, tag: 'front', label: '' });
  const [columnUploadTargetKey, setColumnUploadTargetKey] = useState(null);
  const [activeAdminVariantTab, setActiveAdminVariantTab] = useState('all');

  // Limpiar previews temporales de subida
  const clearGalleryUploadSelection = () => {
    galleryPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    setGalleryPreviews([]);
    setSelectedGalleryFiles([]);
    setSelectedGalleryVariantKey('');
    setColumnUploadTargetKey(null);
    if (galleryFileInputRef.current) {
      galleryFileInputRef.current.value = '';
    }
    if (columnFileInputRef.current) {
      columnFileInputRef.current.value = '';
    }
  };

    // Abrir modal de edición
  const handleOpenEdit = (product) => {
    const rawImages = Array.isArray(product.images) ? product.images : [];
    const autoAssignedImages = autoAssignMissingVariantKeys(rawImages);

    // Reconstruir variantes persistentes:
    // 1) Si product.variants existe y tiene elementos, usarlas.
    // 2) Si está vacío, reconstruir a partir de variantKey de las imágenes.
    // 3) Si tampoco hay imágenes con variantKey, precargar las 4 canónicas circadianas.
    let initialVariants = Array.isArray(product.variants) && product.variants.length > 0
      ? product.variants.map((v, idx) => ({
          key: normalizeVariantKey(v.key || v.name),
          name: v.name || v.key,
          subtitle: v.subtitle || '',
          colorHex: v.colorHex || v.badgeColor || '#CBD5E1',
          badgeColor: v.badgeColor || v.colorHex || '#CBD5E1',
          priceModifier: Number(v.priceModifier) || 0,
          stock: v.stock !== undefined ? Number(v.stock) : 10,
          isAvailable: v.isAvailable !== false,
          order: typeof v.order === 'number' ? v.order : idx,
        }))
      : [];

    if (initialVariants.length === 0) {
      const keysInImages = [
        ...new Set(
          autoAssignedImages
            .filter((img) => img.tag !== 'model' && img.variantKey)
            .map((img) => normalizeVariantKey(img.variantKey))
            .filter(Boolean)
        ),
      ];

      if (keysInImages.length > 0) {
        initialVariants = keysInImages.map((k, idx) => {
          const match = CANONICAL_VARIANTS.find((p) => p.key === k);
          return {
            key: k,
            name: match?.name || k.toUpperCase(),
            subtitle: match?.subtitle || '',
            colorHex: match?.colorHex || '#CBD5E1',
            badgeColor: match?.badgeColor || '#CBD5E1',
            priceModifier: 0,
            stock: 10,
            isAvailable: true,
            order: idx,
          };
        });
      } else {
        initialVariants = CANONICAL_VARIANTS.map((p, idx) => ({
          ...p,
          priceModifier: 0,
          stock: 10,
          isAvailable: true,
          order: idx,
        }));
      }
    }

    initialVariants.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const updatedProduct = {
      ...product,
      images: autoAssignedImages,
      variants: initialVariants,
    };

    setSelectedProduct(updatedProduct);
    setEditPrice(String(product.price));
    setEditStock(String(product.stock));
    setEditIsActive(product.isActive !== false);
    setEditDescription(product.description || '');
    setEditModelCode(product.modelCode || product.code || '');
    setEditHasVariants(true);
    setEditVariantAxisTitle(product.variantAxisTitle || 'Seleccionar Cristal Circadiano');
    setEditVariants(initialVariants);
    setActiveAdminVariantTab('all');
    setModalError(null);
    setSaveSuccess(false);
    clearGalleryUploadSelection();
  };

  // Handlers para edición rápida en grilla
  const handleStartEditCell = (e, product, field) => {
    e.stopPropagation();
    setEditingCell({ productId: product._id, field });
    setCellDraftValue(String(product[field] ?? ''));
  };

  const handleCancelEditCell = () => {
    setEditingCell(null);
    setCellDraftValue('');
  };

  const handleSaveCell = async (product, field) => {
    if (!editingCell || editingCell.productId !== product._id || editingCell.field !== field) return;

    const numVal = Number(cellDraftValue);
    if (isNaN(numVal) || numVal < 0 || (field === 'stock' && !Number.isInteger(numVal))) {
      showToast(`Introduce un ${field === 'price' ? 'precio' : 'stock'} numérico válido.`, 'error');
      setEditingCell(null);
      return;
    }

    if (numVal === product[field]) {
      setEditingCell(null);
      return;
    }

    const cellKey = `${product._id}-${field}`;
    setSavingCellId(cellKey);
    setEditingCell(null);

    try {
      const payload = field === 'price'
        ? { price: numVal, basePrice: numVal }
        : { stock: numVal };

      await productService.updateProduct(product._id, payload);

      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id
            ? { ...p, [field]: numVal, ...(field === 'price' ? { basePrice: numVal } : {}) }
            : p
        )
      );

      setFlashSavedCell(cellKey);
      setTimeout(() => setFlashSavedCell(null), 2000);
      showToast(
        `${field === 'price' ? 'Precio' : 'Stock'} de "${product.shortName}" actualizado a ${
          field === 'price' ? `$ ${numVal.toLocaleString('es-AR')}` : `${numVal} uds.`
        }`
      );
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      showToast('Error al actualizar dato en línea. Revisa tu conexión.', 'error');
    } finally {
      setSavingCellId(null);
    }
  };

    // Persistir variantes de inmediato en MongoDB
  const persistVariantsToBackend = async (productId, newVariants) => {
    try {
      const formatted = newVariants.map((v, idx) => ({
        key: normalizeVariantKey(v.key || v.name),
        name: v.name || v.key,
        subtitle: v.subtitle || '',
        colorHex: v.colorHex || v.badgeColor || '#CBD5E1',
        badgeColor: v.badgeColor || v.colorHex || '#CBD5E1',
        priceModifier: Number(v.priceModifier) || 0,
        stock: v.stock !== undefined ? Number(v.stock) : 10,
        isAvailable: v.isAvailable !== false,
        order: typeof v.order === 'number' ? v.order : idx,
      }));

      await productService.updateProduct(productId, {
        variants: formatted,
        hasVariants: formatted.length > 0,
      });

      setSelectedProduct((prev) => (prev ? { ...prev, variants: formatted } : prev));
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, variants: formatted } : p))
      );
    } catch (err) {
      console.error('[persistVariantsToBackend Error]:', err);
      showToast('Error al persistir variantes en el servidor.', 'error');
    }
  };

  const handleMoveVariantOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editVariants.length) return;

    const newVariants = [...editVariants];
    const [moved] = newVariants.splice(index, 1);
    newVariants.splice(targetIndex, 0, moved);

    const reordered = newVariants.map((v, idx) => ({ ...v, order: idx }));
    setEditVariants(reordered);
    if (selectedProduct) {
      await persistVariantsToBackend(selectedProduct._id, reordered);
    }
    showToast('Orden de variantes actualizado.');
  };

  const handleAddPresetVariant = async (preset) => {
    const normKey = normalizeVariantKey(preset.key);
    if (editVariants.some((v) => normalizeVariantKey(v.key) === normKey)) {
      showToast(`La variante "${preset.name}" ya existe en este producto.`, 'error');
      return;
    }

    const newVariant = {
      key: normKey,
      name: preset.name,
      subtitle: preset.subtitle || '',
      colorHex: preset.colorHex || '#CBD5E1',
      badgeColor: preset.badgeColor || preset.colorHex || '#CBD5E1',
      priceModifier: 0,
      stock: 10,
      isAvailable: true,
      order: editVariants.length,
    };

    const updated = [...editVariants, newVariant];
    setEditVariants(updated);
    if (selectedProduct) {
      await persistVariantsToBackend(selectedProduct._id, updated);
    }
    showToast(`Variante "${preset.name}" agregada.`);
  };

  const handleAddCustomVariant = async () => {
    const name = window.prompt('Nombre de la nueva variante (ej. Noche Plus, Talle L):');
    if (!name || !name.trim()) return;
    const cleanKey = normalizeVariantKey(name);
    if (editVariants.some((v) => normalizeVariantKey(v.key) === cleanKey)) {
      showToast(`Ya existe una variante con la clave "${cleanKey}".`, 'error');
      return;
    }

    const newVariant = {
      key: cleanKey,
      name: name.trim(),
      subtitle: '',
      colorHex: '#CBD5E1',
      badgeColor: '#CBD5E1',
      priceModifier: 0,
      stock: 10,
      isAvailable: true,
      order: editVariants.length,
    };

    const updated = [...editVariants, newVariant];
    setEditVariants(updated);
    if (selectedProduct) {
      await persistVariantsToBackend(selectedProduct._id, updated);
    }
    showToast(`Variante "${name.trim()}" creada.`);
  };

  const handleDeleteVariant = async (index) => {
    const variant = editVariants[index];
    if (!variant || !selectedProduct) return;

    const variantKey = normalizeVariantKey(variant.key);
    const variantPhotos = (selectedProduct.images || []).filter(
      (img) => img.tag !== 'model' && normalizeVariantKey(img.variantKey) === variantKey
    );

    let confirmMsg = `¿Estás seguro de que deseas eliminar la variante "${variant.name}"?`;
    if (variantPhotos.length > 0) {
      confirmMsg += `\n\nEste producto tiene ${variantPhotos.length} foto(s) asignadas a esta variante. Pasarán a "Fotos sin variante asignada".`;
    }

    if (!window.confirm(confirmMsg)) return;

    const newVariants = editVariants
      .filter((_, i) => i !== index)
      .map((v, idx) => ({ ...v, order: idx }));
    setEditVariants(newVariants);

    let updatedImages = selectedProduct.images;
    if (variantPhotos.length > 0) {
      updatedImages = (selectedProduct.images || []).map((img) =>
        normalizeVariantKey(img.variantKey) === variantKey ? { ...img, variantKey: null } : img
      );
      setSelectedProduct((prev) => ({ ...prev, images: updatedImages }));
      setProducts((prev) =>
        prev.map((p) => (p._id === selectedProduct._id ? { ...p, images: updatedImages } : p))
      );
    }

    try {
      await productService.updateProduct(selectedProduct._id, {
        variants: newVariants,
        images: updatedImages,
        hasVariants: newVariants.length > 0,
      });
      showToast(`Variante "${variant.name}" eliminada.`);
    } catch (err) {
      console.error('[handleDeleteVariant Error]:', err);
      showToast('Error al eliminar variante del servidor.', 'error');
    }
  };

  // Subida directa por bloque de variante o modelo
  const handleTriggerDirectUpload = (variantKey, tag = 'front', label = '') => {
    setDirectUploadTarget({ variantKey, tag, label });
    if (directUploadInputRef.current) {
      directUploadInputRef.current.value = '';
      directUploadInputRef.current.click();
    }
  };

  const handleDirectUploadSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedProduct) return;

    setUploadingGallery(true);
    setModalError(null);

    try {
      const processedFiles = await Promise.all(
        files.map(async (f) => compressImageFile(f))
      );

      const targetTag = directUploadTarget.tag || 'front';
      const targetKey = targetTag === 'model'
        ? null
        : (directUploadTarget.variantKey ? normalizeVariantKey(directUploadTarget.variantKey) : null);

      const res = await productService.uploadProductImages(
        selectedProduct._id,
        processedFiles,
        targetTag,
        targetKey
      );

      const updatedProd = res.data?.product || res.data || res;
      const images = Array.isArray(updatedProd.images) ? updatedProd.images : [];
      const currentVariants = editVariants.length > 0 ? editVariants : (updatedProd.variants || []);

      setSelectedProduct((prev) => ({
        ...prev,
        images,
        variants: currentVariants,
      }));

      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, images, variants: currentVariants }
            : p
        )
      );

      showToast(`${processedFiles.length} foto(s) subida(s) con éxito.`);
    } catch (err) {
      console.error('[handleDirectUploadSelected Error]:', err);
      showToast(err.message || 'Error al subir fotos.', 'error');
    } finally {
      setUploadingGallery(false);
      if (directUploadInputRef.current) directUploadInputRef.current.value = '';
    }
  };

  // Reordenar foto secuencialmente dentro de su grupo
  const handleMovePhotoOrder = async (imageId, direction, groupKey) => {
    if (!selectedProduct) return;

    const isModelGroup = groupKey === 'model';
    const groupPhotos = (selectedProduct.images || [])
      .filter((img) =>
        isModelGroup
          ? img.tag === 'model'
          : (img.tag !== 'model' && normalizeVariantKey(img.variantKey) === normalizeVariantKey(groupKey))
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const currentIndex = groupPhotos.findIndex((img) => img._id === imageId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= groupPhotos.length) return;

    const [moved] = groupPhotos.splice(currentIndex, 1);
    groupPhotos.splice(targetIndex, 0, moved);

    const photoOrderMap = new Map();
    groupPhotos.forEach((img, idx) => {
      photoOrderMap.set(img._id, idx);
    });

    const updatedImages = (selectedProduct.images || []).map((img) => {
      if (photoOrderMap.has(img._id)) {
        return {
          ...img,
          order: photoOrderMap.get(img._id),
        };
      }
      return img;
    });

    setSelectedProduct((prev) => ({ ...prev, images: updatedImages }));
    setProducts((prev) =>
      prev.map((p) => (p._id === selectedProduct._id ? { ...p, images: updatedImages } : p))
    );

    try {
      await productService.updateProduct(selectedProduct._id, {
        images: updatedImages,
        variants: editVariants,
      });
    } catch (err) {
      console.error('[handleMovePhotoOrder Error]:', err);
      showToast('Error al persistir orden de fotos.', 'error');
    }
  };

  const handleMovePhotoToVariant = async (imageId, targetKey) => {
    if (!selectedProduct) return;
    try {
      const isModel = targetKey === 'model';
      const newTag = isModel ? 'model' : 'front';
      const newVariantKey = isModel ? null : (targetKey ? normalizeVariantKey(targetKey) : null);

      await productService.updateProductImageMetadata(selectedProduct._id, imageId, {
        tag: newTag,
        variantKey: newVariantKey,
      });

      const updatedImages = (selectedProduct.images || []).map((img) =>
        img._id === imageId
          ? { ...img, tag: newTag, variantKey: newVariantKey }
          : img
      );

      setSelectedProduct((prev) => ({ ...prev, images: updatedImages }));
      setProducts((prev) =>
        prev.map((p) => (p._id === selectedProduct._id ? { ...p, images: updatedImages } : p))
      );

      showToast(isModel ? 'Foto movida a Fotos de Modelo.' : 'Foto reasignada.');
    } catch (err) {
      console.error('[handleMovePhotoToVariant Error]:', err);
      showToast('Error al mover la foto.', 'error');
    }
  };

  const handleUpdatePhotoTag = async (imageId, newTag) => {
    if (!selectedProduct) return;
    try {
      const isHover = newTag === 'angle' || newTag === 'hover';
      await productService.updateProductImageMetadata(selectedProduct._id, imageId, {
        tag: newTag,
        isHover,
      });

      const updatedImages = (selectedProduct.images || []).map((img) =>
        img._id === imageId
          ? { ...img, tag: newTag, isHover }
          : img
      );

      setSelectedProduct((prev) => ({ ...prev, images: updatedImages }));
      setProducts((prev) =>
        prev.map((p) => (p._id === selectedProduct._id ? { ...p, images: updatedImages } : p))
      );

      showToast('Tipo de toma actualizado.');
    } catch (err) {
      console.error('[handleUpdatePhotoTag Error]:', err);
      showToast('Error al actualizar toma.', 'error');
    }
  };

  const handleDeletePhoto = async (imageId) => {
    if (!selectedProduct) return;
    if (!window.confirm('¿Eliminar esta foto del producto y del servidor?')) return;

    try {
      const res = await productService.deleteProductImage(selectedProduct._id, imageId);
      const updatedProduct = res.data?.product || res.data || res;
      const images = Array.isArray(updatedProduct.images) ? updatedProduct.images : [];

      setSelectedProduct((prev) => ({
        ...prev,
        images,
        variants: prev.variants?.length ? prev.variants : editVariants,
      }));
      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, images, variants: p.variants?.length ? p.variants : editVariants }
            : p
        )
      );
      showToast('Foto eliminada correctamente.');
    } catch (err) {
      console.error('[handleDeletePhoto Error]:', err);
      showToast('Error al eliminar la foto.', 'error');
    }
  };

  // Asignar o actualizar variantKey para una foto existente
  const handleUpdateImageVariantKey = async (imageId, newVariantKey) => {
    if (!selectedProduct) return;
    const normalizedKey = newVariantKey && newVariantKey.trim() !== '' && newVariantKey !== 'null'
      ? normalizeVariantKey(newVariantKey)
      : null;

    try {
      await productService.updateProductImageMetadata(selectedProduct._id, imageId, {
        variantKey: normalizedKey,
      });

      const updatedImages = selectedProduct.images.map((img) =>
        img._id === imageId ? { ...img, variantKey: normalizedKey } : img
      );

      setSelectedProduct((prev) => ({ ...prev, images: updatedImages }));
      setProducts((prev) =>
        prev.map((p) => (p._id === selectedProduct._id ? { ...p, images: updatedImages } : p))
      );

      showToast('Foto movida de categoría correctamente.');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      showToast('Error al mover la foto entre categorías.', 'error');
    }
  };

  // Autoclasificación por nombre de archivo
  const classifyImageFile = (filename, existingVariants = []) => {
    const lower = filename.toLowerCase();
    let detectedVariantKey = null;
    let detectedTag = 'gallery';

    // Tags
    if (lower.includes('frente') || lower.includes('front')) detectedTag = 'front';
    else if (lower.includes('perfil') || lower.includes('side')) detectedTag = 'side';
    else if (lower.includes('angulo') || lower.includes('angle')) detectedTag = 'angle';
    else if (lower.includes('modelo') || lower.includes('model')) detectedTag = 'model';
    else if (lower.includes('detalle') || lower.includes('detail')) detectedTag = 'detail';

    // Variantes
    if (lower.includes('noche') || lower.includes('night') || lower.includes('rojo') || lower.includes('red') || lower.includes('sunset')) detectedVariantKey = 'noche';
    else if (lower.includes('dia') || lower.includes('day') || lower.includes('amarill') || lower.includes('yellow')) detectedVariantKey = 'dia';
    else if (lower.includes('transicion') || lower.includes('transition') || lower.includes('naranj') || lower.includes('orang') || lower.includes('amber')) detectedVariantKey = 'transicion';
    else if (lower.includes('clear') || lower.includes('cristal') || lower.includes('transp') || lower.includes('neutr')) detectedVariantKey = 'clear';
    else if (lower.includes('carey') || lower.includes('tortoise')) detectedVariantKey = 'carey';
    else if (lower.includes('negro') || lower.includes('black')) detectedVariantKey = 'negro-mate';

    // Si detectamos variantKey, verificar con las variantes existentes del producto
    if (detectedVariantKey && existingVariants.length > 0) {
      const match = existingVariants.find((v) => v.key?.toLowerCase() === detectedVariantKey);
      if (!match) {
        const partial = existingVariants.find((v) => v.key?.toLowerCase().includes(detectedVariantKey));
        if (partial) detectedVariantKey = partial.key;
      }
    }

    return { tag: detectedTag, variantKey: detectedVariantKey };
  };

  // Cerrar modal
  const handleCloseModal = () => {
    if (saving || uploadingGallery) return;
    clearGalleryUploadSelection();
    setSelectedProduct(null);
    setModalError(null);
    setSaveSuccess(false);
  };

  // Compresión y optimización previa en el cliente usando HTML5 Canvas
  const compressImageFile = async (file) => {
    // Si no es imagen procesable o es SVG/GIF, retornar archivo original
    if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
      return file;
    }

    return new Promise((resolve) => {
      try {
        const reader = new FileReader();

        reader.onerror = () => {
          console.warn(`[Client Compression] Fallo al leer "${file.name}". Usando archivo original.`);
          resolve(file);
        };

        reader.onload = (e) => {
          const img = new Image();

          img.onerror = () => {
            console.warn(`[Client Compression] Fallo al decodificar "${file.name}". Usando archivo original.`);
            resolve(file);
          };

          img.onload = () => {
            try {
              let width = img.naturalWidth || img.width;
              let height = img.naturalHeight || img.height;

              // Redimensionar si supera los 2000px de ancho a un máximo de 1920px manteniendo aspect ratio
              const MAX_WIDTH = 1920;
              if (width > 2000) {
                const ratio = MAX_WIDTH / width;
                width = MAX_WIDTH;
                height = Math.round(height * ratio);
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve(file);
                return;
              }

              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);

              // Exportar a WebP (o JPEG como fallback) con calidad 0.85
              const outputMime = 'image/webp';
              const quality = 0.85;

              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    console.warn(`[Client Compression] No se pudo generar Blob para "${file.name}". Usando archivo original.`);
                    resolve(file);
                    return;
                  }

                  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                  const newFileName = `${baseName}.webp`;

                  const compressedFile = new File([blob], newFileName, {
                    type: outputMime,
                    lastModified: Date.now(),
                  });

                  // Si el comprimido es más pesado que el original, preservar el original
                  if (compressedFile.size > file.size) {
                    resolve(file);
                  } else {
                    resolve(compressedFile);
                  }
                },
                outputMime,
                quality
              );
            } catch (err) {
              console.warn(`[Client Compression Error] Error procesando "${file.name}":`, err);
              resolve(file);
            }
          };

          img.src = e.target.result;
        };

        reader.readAsDataURL(file);
      } catch (err) {
        console.warn(`[Client Compression] Error general:`, err);
        resolve(file);
      }
    });
  };

  // Selección de múltiples archivos para la galería con soporte de clasificación automática
  const handleGalleryFilesChange = (e, forcedVariantKey = undefined) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > 20) {
      setModalError('Puedes subir un máximo de 20 fotos por vez.');
      return;
    }

    // Validar formato y tamaño (hasta 25 MB gracias a la compresión en cliente)
    for (const f of files) {
      if (!f.type.startsWith('image/')) {
        setModalError(`El archivo "${f.name}" no es una imagen válida.`);
        return;
      }
      if (f.size > 25 * 1024 * 1024) {
        setModalError(`"${f.name}" supera el límite de 25 MB.`);
        return;
      }
    }

    // Crear previews con autoclasificación
    const activeVariants = editVariants.length > 0 ? editVariants : (selectedProduct?.variants || []);
    const effectiveVariantKey = forcedVariantKey !== undefined
      ? forcedVariantKey
      : (activeAdminVariantTab !== 'all' ? (activeAdminVariantTab === 'unassigned' ? null : activeAdminVariantTab) : undefined);

    const newPreviews = files.map((f) => {
      const classification = classifyImageFile(f.name, activeVariants);
      const assignedVariant = effectiveVariantKey !== undefined
        ? effectiveVariantKey
        : classification.variantKey;
      const assignedTag = classification.tag || 'gallery';

      return {
        file: f,
        url: URL.createObjectURL(f),
        name: f.name,
        size: (f.size / 1024).toFixed(0),
        tag: assignedTag,
        variantKey: assignedVariant ? normalizeVariantKey(assignedVariant) : null,
        autoDetected: Boolean(classification.variantKey || classification.tag !== 'gallery'),
      };
    });

    setGalleryPreviews(newPreviews);
    setSelectedGalleryFiles(files);
    if (effectiveVariantKey !== undefined) {
      setSelectedGalleryVariantKey(effectiveVariantKey ? normalizeVariantKey(effectiveVariantKey) : '');
    } else if (newPreviews[0]?.variantKey) {
      setSelectedGalleryVariantKey(newPreviews[0].variantKey);
    }
    setModalError(null);
  };

  // Abrir selector de archivos directo para una columna de variante específica
  const handleTriggerColumnUpload = (variantKey) => {
    const normKey = variantKey && variantKey !== 'null'
      ? normalizeVariantKey(variantKey)
      : null;
    setColumnUploadTargetKey(normKey);
    if (columnFileInputRef.current) {
      columnFileInputRef.current.value = '';
      columnFileInputRef.current.click();
    }
  };

  // Modificar tag o variantKey de un preview específico antes de subir
  const handleUpdatePreviewMetadata = (idx, field, value) => {
    let cleanVal = value || null;
    if (field === 'variantKey' && cleanVal && cleanVal !== 'null') {
      cleanVal = normalizeVariantKey(cleanVal);
    }
    setGalleryPreviews((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: cleanVal } : p))
    );
  };

  // Ejecutar subida de las fotos seleccionadas a la galería
  const handleUploadGalleryPhotos = async () => {
    if (galleryPreviews.length === 0 || !selectedProduct) return;

    setUploadingGallery(true);
    setModalError(null);

    try {
      // Compresión previa en el cliente (<canvas>, max 1920px, calidad 0.85, fallback a original)
      const processedPreviews = await Promise.all(
        galleryPreviews.map(async (prevItem) => {
          const compressed = await compressImageFile(prevItem.file);
          return {
            ...prevItem,
            file: compressed,
          };
        })
      );

      // Agrupar previews por (tag, variantKey) para enviar cada lote con sus metadatos exactos
      const groups = {};
      processedPreviews.forEach((prevItem) => {
        const normKey = prevItem.variantKey && prevItem.variantKey !== 'null'
          ? normalizeVariantKey(prevItem.variantKey)
          : null;
        const groupKey = `${prevItem.tag || 'gallery'}__${normKey || 'null'}`;
        if (!groups[groupKey]) {
          groups[groupKey] = {
            tag: prevItem.tag || 'gallery',
            variantKey: normKey,
            files: [],
          };
        }
        groups[groupKey].files.push(prevItem.file);
      });

      let latestProduct = null;

      for (const group of Object.values(groups)) {
        const res = await productService.uploadProductImages(
          selectedProduct._id,
          group.files,
          group.tag,
          group.variantKey
        );
        latestProduct = res.data || latestProduct;
      }

      if (!latestProduct) throw new Error('Respuesta inválida del servidor.');

      const payload = latestProduct;
      const updatedProd = payload?.product || payload?.data || payload;
      const sortedImages = [...(updatedProd?.images || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );

      const updatedImages = sortedImages.map((img, idx) => ({
        _id: img._id,
        url: img.url,
        tag: img.tag || 'gallery',
        variantKey: img.variantKey || null,
        isPrimary: Boolean(img.isPrimary),
        isHover: Boolean(img.isHover || img.tag === 'hover'),
        order: img.order !== undefined ? img.order : idx,
      }));

      const primary = updatedImages.find((img) => img.isPrimary) || updatedImages[0];
      const newPreview = primary?.url || latestProduct.image_url;

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

      clearGalleryUploadSelection();
      showToast(`${galleryPreviews.length} foto(s) añadidas a la galería y autoclasificadas con éxito.`);
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
      await productService.updateImageMetadata(selectedProduct._id, imageId, {
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

  // Marcar una imagen puntual como foto de hover (al pasar el cursor)
  const handleSetHoverImage = async (imageId) => {
    if (!selectedProduct) return;

    try {
      const targetImg = selectedProduct.images.find((img) => img._id === imageId);
      const isCurrentlyHover = Boolean(targetImg?.isHover || targetImg?.tag === 'hover');
      const nextIsHover = !isCurrentlyHover;

      await productService.updateImageMetadata(selectedProduct._id, imageId, {
        isHover: nextIsHover,
        tag: nextIsHover ? (targetImg?.tag === 'gallery' ? 'hover' : targetImg?.tag) : (targetImg?.tag === 'hover' ? 'gallery' : targetImg?.tag),
      });

      const updatedImages = selectedProduct.images.map((img) => ({
        ...img,
        isHover: nextIsHover ? img._id === imageId : false,
        tag: img._id === imageId
          ? (nextIsHover ? (img.tag === 'gallery' ? 'hover' : img.tag) : (img.tag === 'hover' ? 'gallery' : img.tag))
          : (nextIsHover && img.tag === 'hover' ? 'gallery' : img.tag),
      }));

      setSelectedProduct((prev) => ({
        ...prev,
        images: updatedImages,
      }));

      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, images: updatedImages }
            : p
        )
      );

      showToast(nextIsHover ? 'Foto de hover configurada exitosamente.' : 'Foto de hover desmarcada.');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      showToast('Error al actualizar la foto de hover.', 'error');
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
      const payload = res.data;
      const updatedProduct = payload?.product || payload?.data || payload;

      const sortedImages = [...(updatedProduct?.images || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );

      const updatedImages = sortedImages.map((img, idx) => ({
        _id: img._id,
        url: img.url,
        tag: img.tag || 'gallery',
        variantKey: img.variantKey || null,
        isPrimary: Boolean(img.isPrimary),
        isHover: Boolean(img.isHover || img.tag === 'hover'),
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

  // Eliminar producto permanentemente de MongoDB y almacenamiento
  const handleDeleteProduct = async (productOrId, productName = '') => {
    const id = typeof productOrId === 'string' ? productOrId : productOrId?._id;
    const name =
      productName ||
      (typeof productOrId === 'object'
        ? (productOrId.shortName || productOrId.name || productOrId.modelCode)
        : 'este producto');

    if (!id) return;

    const confirmMsg = `¿Estás seguro de que deseas eliminar permanentemente el producto "${name}"?\n\nEsta acción borrará el documento de MongoDB y todos los archivos físicos de sus fotos en el servidor.\n\nEsta acción NO se puede deshacer.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await productService.deleteProduct(id);

      // Quitar inmediatamente del estado local de productos
      setProducts((prev) => prev.filter((p) => p._id !== id));

      // Si el modal de edición de este producto estaba abierto, cerrarlo
      if (selectedProduct && selectedProduct._id === id) {
        handleCloseModal();
      }

      showToast(`Producto "${name}" eliminado exitosamente.`);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      console.error('[handleDeleteProduct Error]:', err);
      showToast(err.message || 'Error al eliminar el producto del servidor.', 'error');
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
      const formattedVariants = editHasVariants
        ? editVariants.map((v, i) => {
            const rawKey = v.key?.trim() || v.name?.trim() || `var-${i + 1}`;
            const cleanKey = rawKey
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9_-]+/g, '-')
              .replace(/^-+|-+$/g, '');
            return {
              key: cleanKey || `var-${i + 1}`,
              name: v.name?.trim() || `Variante ${i + 1}`,
              subtitle: v.subtitle?.trim() || '',
              badgeColor: v.badgeColor || '#FFFFFF',
              priceModifier: Number(v.priceModifier) || 0,
              isDefault: Boolean(v.isDefault),
            };
          })
        : [];

      const payload = {
        modelCode: editModelCode.trim().toUpperCase() || undefined,
        price: numericPrice,
        basePrice: numericPrice,
        stock: numericStock,
        description: editDescription.trim(),
        isActive: editIsActive,
        hasVariants: editHasVariants,
        variantAxisTitle: editVariantAxisTitle.trim() || 'Seleccionar Variante',
        variants: formattedVariants,
        images: selectedProduct.images || [],
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
              hasVariants: updatedData.hasVariants !== undefined ? updatedData.hasVariants : editHasVariants,
              variantAxisTitle: updatedData.variantAxisTitle || editVariantAxisTitle,
              variants: Array.isArray(updatedData.variants) ? updatedData.variants : formattedVariants,
              images: updatedData.images || selectedProduct.images || p.images,
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
                setActiveTab('coupons');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-medium tracking-wide transition-all ${
                activeTab === 'coupons'
                  ? 'bg-white text-cirqa-negro shadow-md font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Percent className={`w-4 h-4 ${activeTab === 'coupons' ? 'text-cirqa-primario' : 'text-cirqa-arena'}`} />
                <span>Cupones / Descuentos</span>
              </div>
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
                <ClipboardList className={`w-4 h-4 ${activeTab === 'orders' ? 'text-cirqa-primario' : 'text-cirqa-arena'}`} />
                <span>Pedidos</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === 'orders'
                    ? 'bg-cirqa-negro/5 text-cirqa-negro font-bold'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                {ordersCount}
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
                {activeTab === 'inventory' ? 'Gestión de Inventario' : activeTab === 'orders' ? 'Gestión de Pedidos' : 'Gestión de Cupones y Descuentos'}
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Botón de Creación de Producto (solo en Inventario) */}
              {activeTab === 'inventory' && (
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cirqa-primario hover:bg-cirqa-negro text-white text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Producto</span>
                </button>
              )}

              {activeTab === 'inventory' && (
                <button
                  onClick={fetchInventory}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-cirqa-negro/10 text-cirqa-negro/70 hover:text-cirqa-negro hover:border-cirqa-negro/25 text-xs font-medium transition-all shadow-sm disabled:opacity-50"
                  title="Sincronizar con MongoDB"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cirqa-primario' : ''}`} />
                  <span>Sincronizar</span>
                </button>
              )}

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

                          {/* Columna 3: Precio Editable en Grilla */}
                          <div className="col-span-2">
                            {editingCell?.productId === product._id && editingCell?.field === 'price' ? (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="number"
                                  min="0"
                                  step="100"
                                  value={cellDraftValue}
                                  onChange={(e) => setCellDraftValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell(product, 'price');
                                    if (e.key === 'Escape') handleCancelEditCell();
                                  }}
                                  onBlur={() => handleSaveCell(product, 'price')}
                                  autoFocus
                                  className="w-24 px-2 py-1 text-xs font-mono font-semibold bg-white border-2 border-cirqa-primario rounded-lg shadow-sm focus:outline-none"
                                />
                              </div>
                            ) : (
                              <div
                                onClick={(e) => handleStartEditCell(e, product, 'price')}
                                title="Clic para editar precio directamente en la grilla"
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all group/cell ${
                                  flashSavedCell === `${product._id}-price`
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'hover:bg-black/5 hover:border hover:border-cirqa-negro/15'
                                }`}
                              >
                                <span className="text-xs font-medium text-cirqa-negro font-mono">
                                  {formatMoney(product.price)}
                                </span>
                                <Edit3 className="w-3 h-3 text-cirqa-negro/25 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </div>

                          {/* Columna 4: Stock Editable en Grilla */}
                          <div className="col-span-2 flex items-center gap-2">
                            {editingCell?.productId === product._id && editingCell?.field === 'stock' ? (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="number"
                                  min="0"
                                  value={cellDraftValue}
                                  onChange={(e) => setCellDraftValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell(product, 'stock');
                                    if (e.key === 'Escape') handleCancelEditCell();
                                  }}
                                  onBlur={() => handleSaveCell(product, 'stock')}
                                  autoFocus
                                  className="w-20 px-2 py-1 text-xs font-mono font-semibold bg-white border-2 border-cirqa-primario rounded-lg shadow-sm focus:outline-none"
                                />
                              </div>
                            ) : (
                              <div
                                onClick={(e) => handleStartEditCell(e, product, 'stock')}
                                title="Clic para editar stock directamente en la grilla"
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all group/cell ${
                                  flashSavedCell === `${product._id}-stock`
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'hover:bg-black/5 hover:border hover:border-cirqa-negro/15'
                                }`}
                              >
                                <span className="text-xs font-semibold text-cirqa-negro font-mono">
                                  {product.stock}
                                </span>
                                <span className="text-[10px] text-cirqa-negro/40 font-light hidden sm:inline">
                                  uds.
                                </span>
                                <div className="ml-1">
                                  {getStockBadge(product.stock)}
                                </div>
                                <Edit3 className="w-3 h-3 text-cirqa-negro/25 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </div>

                          {/* Columna 5: Estado / Visibilidad Directa & Acciones */}
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleToggleActiveQuick(e, product)}
                              title={product.isActive ? 'Producto activo en catálogo (clic para ocultar)' : 'Producto oculto (clic para activar)'}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                                product.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-black/5 text-cirqa-negro/40 border-cirqa-negro/10 hover:bg-black/10'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              <span>{product.isActive ? 'Activo' : 'Oculto'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(product);
                              }}
                              className="p-1.5 rounded-full hover:bg-black/5 text-cirqa-primario transition-colors cursor-pointer"
                              title="Editar producto y fotos"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product);
                              }}
                              className="p-1.5 rounded-full text-red-500 hover:text-white hover:bg-red-600 transition-all cursor-pointer opacity-70 hover:opacity-100"
                              title={`Eliminar producto ${product.shortName} permanentemente`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
            <OrdersTab
              showToast={showToast}
              onOrdersCountChange={setOrdersCount}
            />
          )}

          {activeTab === 'coupons' && (
            <CouponsTab
              showToast={showToast}
            />
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
              className="relative w-full max-w-4xl lg:max-w-5xl bg-white/95 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-3xl p-6 sm:p-8 text-cirqa-negro overflow-hidden z-10 my-8 max-h-[92vh] overflow-y-auto"
            >
              
              <button
                onClick={handleCloseModal}
                disabled={saving || uploadingGallery}
                className="absolute top-6 right-6 p-2 rounded-full text-cirqa-negro/40 hover:text-cirqa-negro hover:bg-black/5 transition-all cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Encabezado del Producto */}
              <div className="flex items-center justify-between pb-5 border-b border-cirqa-negro/10 pr-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#F4EFEA] border border-cirqa-negro/5 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
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

                <button
                  type="button"
                  onClick={() => handleDeleteProduct(selectedProduct)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-2xs active:scale-95"
                  title="Eliminar este producto de MongoDB y servidor"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Producto</span>
                </button>
              </div>

              {/* ========================================================================= */}
              {/* MÓDULO 3: PANEL ADMINISTRADOR DE VARIANTES E IMÁGENES                   */}
              {/* ========================================================================= */}
              <div className="mt-5 p-5 rounded-3xl bg-[#FBFBFA] border border-cirqa-negro/10 space-y-6">
                {/* Encabezado General */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-cirqa-negro/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cirqa-primario/10 flex items-center justify-center text-cirqa-primario">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cirqa-negro">
                        Variantes y Fotos del Producto
                      </h4>
                      <p className="text-[10px] text-cirqa-negro/50 font-light">
                        Configurá las variantes y subí múltiples fotos. Las fotos de modelo se mostrarán automáticamente al final en todas las variantes.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-cirqa-negro/60 bg-black/5 px-2.5 py-1 rounded-full font-semibold">
                      {selectedProduct.images?.length || 0} fotos totales en catálogo
                    </span>
                  </div>
                </div>

                {/* BARRA DE GESTIÓN Y REORDENAMIENTO DE VARIANTES */}
                <div className="p-4 rounded-2xl bg-white border border-cirqa-negro/10 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-semibold text-cirqa-negro">
                        Variantes del Producto ({editVariants.length})
                      </span>
                      <span className="text-[10px] text-cirqa-negro/40">
                        — Posición en tienda configurada en tiempo real
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-cirqa-negro/40 uppercase font-semibold mr-1">Agregar:</span>
                      {CANONICAL_VARIANTS.map((preset) => {
                        const exists = editVariants.some((v) => normalizeVariantKey(v.key) === preset.key);
                        return (
                          <button
                            key={preset.key}
                            type="button"
                            disabled={exists}
                            onClick={() => handleAddPresetVariant(preset)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-medium border flex items-center gap-1 transition-all ${
                              exists
                                ? 'opacity-40 bg-black/5 text-cirqa-negro/40 border-transparent cursor-not-allowed'
                                : 'bg-white hover:bg-black/5 text-cirqa-negro/80 border-cirqa-negro/15 cursor-pointer active:scale-95'
                            }`}
                            title={exists ? `"${preset.name}" ya existe` : `Agregar variante ${preset.name}`}
                          >
                            <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: preset.colorHex }} />
                            <span>{preset.name}</span>
                            {!exists && <Plus className="w-2.5 h-2.5 text-cirqa-primario" />}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={handleAddCustomVariant}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-cirqa-negro text-white hover:bg-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Personalizada</span>
                      </button>
                    </div>
                  </div>

                  {/* Lista Horizontal de Variantes para Reordenar con Flechas */}
                  {editVariants.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      No hay variantes definidas. Agregá al menos una variante para organizar las fotos del producto.
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                      {editVariants.map((v, vIdx) => {
                        const vKey = normalizeVariantKey(v.key);
                        const vPhotos = (selectedProduct.images || []).filter(
                          (img) => img.tag !== 'model' && normalizeVariantKey(img.variantKey) === vKey
                        );

                        return (
                          <div
                            key={v.key || vIdx}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FBFBFA] border border-cirqa-negro/10 flex-shrink-0 shadow-2xs"
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                              style={{ backgroundColor: v.colorHex || v.badgeColor || '#E5E7EB' }}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-cirqa-negro leading-tight">
                                {v.name}
                              </span>
                              <span className="text-[9px] text-cirqa-negro/50 font-mono">
                                {vPhotos.length} foto{vPhotos.length !== 1 ? 's' : ''}
                              </span>
                            </div>

                            {/* Botones de Reordenamiento de Variante (↑ Subir / ↓ Bajar) */}
                            <div className="flex items-center gap-0.5 ml-1 border-l border-cirqa-negro/10 pl-1.5">
                              <button
                                type="button"
                                disabled={vIdx === 0}
                                onClick={() => handleMoveVariantOrder(vIdx, 'up')}
                                className="p-1 rounded hover:bg-black/10 text-cirqa-negro/60 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                title="Mover antes (izquierda / arriba)"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={vIdx === editVariants.length - 1}
                                onClick={() => handleMoveVariantOrder(vIdx, 'down')}
                                className="p-1 rounded hover:bg-black/10 text-cirqa-negro/60 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                title="Mover después (derecha / abajo)"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVariant(vIdx)}
                                className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 cursor-pointer transition-colors ml-0.5"
                                title={`Eliminar variante "${v.name}"`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CONTENEDOR VISUAL POR CADA VARIANTE */}
                <div className="space-y-4">
                  {editVariants.map((variant) => {
                    const vKey = normalizeVariantKey(variant.key);
                    const variantPhotos = (selectedProduct.images || [])
                      .filter((img) => img.tag !== 'model' && normalizeVariantKey(img.variantKey) === vKey)
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                    const hasPhotos = variantPhotos.length > 0;

                    return (
                      <div
                        key={variant.key}
                        className="bg-white rounded-2xl border border-cirqa-negro/10 overflow-hidden shadow-2xs transition-all hover:border-cirqa-negro/25"
                      >
                        {/* Header del Bloque de la Variante */}
                        <div className="p-3.5 bg-[#FBFBFA] border-b border-cirqa-negro/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs flex-shrink-0"
                              style={{ backgroundColor: variant.colorHex || variant.badgeColor || '#E5E7EB' }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs font-bold text-cirqa-negro">
                                  {variant.name}
                                </h5>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                                  hasPhotos ? 'bg-black/5 text-cirqa-negro/70' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {variantPhotos.length} {variantPhotos.length === 1 ? 'foto' : 'fotos'}
                                </span>
                              </div>
                              {variant.subtitle && (
                                <span className="text-[10px] text-cirqa-negro/40 block font-light">
                                  {variant.subtitle}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botón de Subida Directa para esta variante */}
                          <button
                            type="button"
                            disabled={uploadingGallery}
                            onClick={() => handleTriggerDirectUpload(variant.key, 'front', variant.name)}
                            className="px-3.5 py-1.5 rounded-xl bg-cirqa-negro hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            <UploadCloud className="w-3.5 h-3.5 text-cirqa-arena" />
                            <span>Subir fotos a {variant.name}</span>
                          </button>
                        </div>

                        {/* Cuerpo del Bloque */}
                        <div className="p-3.5">
                          {!hasPhotos ? (
                            /* AVISO REGLA DE ORO: SI TIENE 0 FOTOS, PERMANECERÁ OCULTA */
                            <div
                              onClick={() => handleTriggerDirectUpload(variant.key, 'front', variant.name)}
                              className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-center cursor-pointer transition-colors space-y-1"
                            >
                              <div className="flex items-center justify-center gap-1.5 text-amber-800 text-xs font-semibold">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <span>Sin fotos: esta variante permanecerá oculta en la tienda hasta que subas al menos 1 imagen</span>
                              </div>
                              <p className="text-[11px] text-amber-700/80">
                                Hacé clic aquí o en "Subir fotos a {variant.name}" para agregar imágenes.
                              </p>
                            </div>
                          ) : (
                            /* GRILLA DE FOTOS DE LA VARIANTE */
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {variantPhotos.map((img, pIdx) => {
                                const isFirst = pIdx === 0;
                                const isLast = pIdx === variantPhotos.length - 1;
                                const isImgPrimary = Boolean(img.isPrimary);
                                const isImgHover = Boolean(img.isHover || img.tag === 'hover' || img.tag === 'angle');

                                return (
                                  <div
                                    key={img._id || pIdx}
                                    className="p-2.5 rounded-xl bg-[#FBFBFA] border border-cirqa-negro/10 hover:border-cirqa-negro/25 transition-all flex flex-col gap-2 shadow-2xs"
                                  >
                                    {/* Miniatura + Orden + Badges */}
                                    <div className="relative w-full h-32 bg-white rounded-lg border border-cirqa-negro/10 overflow-hidden flex items-center justify-center">
                                      <img
                                        src={formatMediaUrl(img.url)}
                                        alt={`${variant.name} foto ${pIdx + 1}`}
                                        className="w-full h-full object-contain p-1"
                                      />
                                      {/* Indicador de Posición */}
                                      <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                                        #{pIdx + 1}
                                      </span>

                                      {/* Badges de Portada / Hover */}
                                      <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-end pointer-events-none">
                                        {isImgPrimary && (
                                          <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm leading-none uppercase tracking-wider flex items-center gap-0.5">
                                            <Star className="w-2.5 h-2.5 fill-current" />
                                            PORTADA
                                          </span>
                                        )}
                                        {isImgHover && (
                                          <span className="bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm leading-none uppercase tracking-wider flex items-center gap-0.5">
                                            <Eye className="w-2.5 h-2.5" />
                                            HOVER
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Botones de Reordenamiento Secuencial (← y →) */}
                                    <div className="flex items-center justify-between gap-1 pt-0.5">
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={isFirst}
                                          onClick={() => handleMovePhotoOrder(img._id, 'left', variant.key)}
                                          className="px-2 py-1 rounded bg-white hover:bg-black/5 text-cirqa-negro/70 border border-cirqa-negro/10 text-[10px] font-semibold flex items-center gap-0.5 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                          title="Mover antes (←)"
                                        >
                                          <ArrowLeft className="w-3 h-3" />
                                          <span>Mover</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isLast}
                                          onClick={() => handleMovePhotoOrder(img._id, 'right', variant.key)}
                                          className="px-2 py-1 rounded bg-white hover:bg-black/5 text-cirqa-negro/70 border border-cirqa-negro/10 text-[10px] font-semibold flex items-center gap-0.5 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                          title="Mover después (→)"
                                        >
                                          <span>Mover</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleDeletePhoto(img._id)}
                                        className="p-1 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors cursor-pointer border border-red-200 hover:border-red-600"
                                        title="Eliminar foto"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Selectores de Tipo de Toma y Mover a otra variante */}
                                    <div className="space-y-1.5 pt-1.5 border-t border-cirqa-negro/10 text-[10px]">
                                      <div className="flex items-center justify-between gap-1.5">
                                        <span className="text-[9px] uppercase tracking-wider text-cirqa-negro/40 flex-shrink-0">Toma:</span>
                                        <select
                                          value={img.tag || 'front'}
                                          onChange={(e) => handleUpdatePhotoTag(img._id, e.target.value)}
                                          className="flex-1 min-w-0 text-[10px] bg-white border border-cirqa-negro/15 rounded px-1.5 py-0.5 text-cirqa-negro focus:outline-none focus:border-cirqa-negro truncate cursor-pointer"
                                        >
                                          <option value="front">Frente (Principal)</option>
                                          <option value="angle">Ángulo / Perfil (Hover)</option>
                                          <option value="side">Lateral</option>
                                          <option value="detail">Detalle Técnico</option>
                                          <option value="gallery">Galería General</option>
                                        </select>
                                      </div>

                                      <div className="flex items-center justify-between gap-1.5">
                                        <span className="text-[9px] uppercase tracking-wider text-cirqa-negro/40 flex-shrink-0">Mover:</span>
                                        <select
                                          value={img.variantKey || ''}
                                          onChange={(e) => handleMovePhotoToVariant(img._id, e.target.value)}
                                          className="flex-1 min-w-0 text-[10px] bg-white border border-cirqa-negro/15 rounded px-1.5 py-0.5 text-cirqa-negro focus:outline-none focus:border-cirqa-negro truncate cursor-pointer"
                                        >
                                          {editVariants.map((ov) => (
                                            <option key={ov.key} value={ov.key}>
                                              {ov.name}
                                            </option>
                                          ))}
                                          <option value="model">→ Fotos con Modelo</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* SECCIÓN SEPARADA AL FINAL: FOTOS CON MODELO */}
                {(() => {
                  const modelPhotos = (selectedProduct.images || [])
                    .filter((img) => img.tag === 'model')
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                  return (
                    <div className="bg-white rounded-2xl border-2 border-indigo-100 overflow-hidden shadow-2xs">
                      <div className="p-3.5 bg-indigo-50/60 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            M
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-cirqa-negro">
                                Fotos con Modelo (Se muestran al final en todas las variantes)
                              </h5>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-900">
                                {modelPhotos.length} {modelPhotos.length === 1 ? 'foto' : 'fotos'}
                              </span>
                            </div>
                            <span className="text-[10px] text-cirqa-negro/50 block font-light">
                              Estas fotos son generales del producto (`tag: 'model'`, `variantKey: null`). El cliente las verá siempre después de las fotos específicas del cristal seleccionado.
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={uploadingGallery}
                          onClick={() => handleTriggerDirectUpload(null, 'model', 'Modelo')}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Subir fotos de Modelo</span>
                        </button>
                      </div>

                      <div className="p-3.5">
                        {modelPhotos.length === 0 ? (
                          <div
                            onClick={() => handleTriggerDirectUpload(null, 'model', 'Modelo')}
                            className="p-4 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50/50 text-center cursor-pointer transition-colors space-y-1"
                          >
                            <p className="text-xs font-semibold text-indigo-900">
                              No hay fotos de modelo cargadas
                            </p>
                            <p className="text-[11px] text-indigo-700/70">
                              Hacé clic aquí para subir fotos de modelos usando este armazón.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {modelPhotos.map((img, mIdx) => {
                              const isFirst = mIdx === 0;
                              const isLast = mIdx === modelPhotos.length - 1;

                              return (
                                <div
                                  key={img._id || mIdx}
                                  className="p-2.5 rounded-xl bg-[#FBFBFA] border border-cirqa-negro/10 hover:border-indigo-300 transition-all flex flex-col gap-2 shadow-2xs"
                                >
                                  <div className="relative w-full h-32 bg-white rounded-lg border border-cirqa-negro/10 overflow-hidden flex items-center justify-center">
                                    <img
                                      src={formatMediaUrl(img.url)}
                                      alt={`Modelo foto ${mIdx + 1}`}
                                      className="w-full h-full object-contain p-1"
                                    />
                                    <span className="absolute top-1.5 left-1.5 bg-indigo-950/80 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                                      Modelo #{mIdx + 1}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-1 pt-0.5">
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={isFirst}
                                        onClick={() => handleMovePhotoOrder(img._id, 'left', 'model')}
                                        className="px-2 py-1 rounded bg-white hover:bg-black/5 text-cirqa-negro/70 border border-cirqa-negro/10 text-[10px] font-semibold flex items-center gap-0.5 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                        title="Mover antes (←)"
                                      >
                                        <ArrowLeft className="w-3 h-3" />
                                        <span>Mover</span>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isLast}
                                        onClick={() => handleMovePhotoOrder(img._id, 'right', 'model')}
                                        className="px-2 py-1 rounded bg-white hover:bg-black/5 text-cirqa-negro/70 border border-cirqa-negro/10 text-[10px] font-semibold flex items-center gap-0.5 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                        title="Mover después (→)"
                                      >
                                        <span>Mover</span>
                                        <ArrowRight className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeletePhoto(img._id)}
                                      className="p-1 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors cursor-pointer border border-red-200 hover:border-red-600"
                                      title="Eliminar foto de modelo"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <div className="pt-1.5 border-t border-cirqa-negro/10 text-[10px]">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span className="text-[9px] uppercase tracking-wider text-cirqa-negro/40 flex-shrink-0">Mover a:</span>
                                      <select
                                        value="model"
                                        onChange={(e) => handleMovePhotoToVariant(img._id, e.target.value)}
                                        className="flex-1 min-w-0 text-[10px] bg-white border border-cirqa-negro/15 rounded px-1.5 py-0.5 text-cirqa-negro focus:outline-none focus:border-cirqa-negro truncate cursor-pointer"
                                      >
                                        <option value="model">Foto con Modelo (Actual)</option>
                                        {editVariants.map((ov) => (
                                          <option key={ov.key} value={ov.key}>
                                            → Mover a {ov.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* SECCIÓN FOTOS SIN ASIGNAR (SI EXISTEN FOTOS HUÉRFANAS) */}
                {(() => {
                  const unassignedPhotos = (selectedProduct.images || []).filter(
                    (img) => img.tag !== 'model' && (!img.variantKey || img.variantKey === 'null')
                  );

                  if (unassignedPhotos.length === 0) return null;

                  return (
                    <div className="bg-white rounded-2xl border border-cirqa-negro/10 overflow-hidden shadow-2xs">
                      <div className="p-3.5 bg-gray-50 border-b border-cirqa-negro/10 flex items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-cirqa-negro">
                            Fotos sin variante asignada ({unassignedPhotos.length})
                          </h5>
                          <span className="text-[10px] text-cirqa-negro/50 font-light">
                            Asigná estas fotos a una de las variantes para que se muestren en la tienda.
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {unassignedPhotos.map((img, uIdx) => (
                          <div
                            key={img._id || uIdx}
                            className="p-2.5 rounded-xl bg-[#FBFBFA] border border-cirqa-negro/10 flex flex-col gap-2"
                          >
                            <div className="w-full h-28 bg-white rounded-lg border border-cirqa-negro/10 overflow-hidden flex items-center justify-center">
                              <img
                                src={formatMediaUrl(img.url)}
                                alt="Foto sin asignar"
                                className="w-full h-full object-contain p-1"
                              />
                            </div>

                            <div className="space-y-1 text-[10px]">
                              <span className="text-[9px] uppercase tracking-wider text-cirqa-negro/40 block">Asignar a:</span>
                              <select
                                value=""
                                onChange={(e) => handleMovePhotoToVariant(img._id, e.target.value)}
                                className="w-full text-[10px] bg-white border border-cirqa-negro/15 rounded px-1.5 py-1 text-cirqa-negro focus:outline-none cursor-pointer"
                              >
                                <option value="">Seleccionar variante...</option>
                                {editVariants.map((v) => (
                                  <option key={v.key} value={v.key}>
                                    {v.name}
                                  </option>
                                ))}
                                <option value="model">Foto con Modelo</option>
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(img._id)}
                              className="mt-1 py-1 text-red-500 hover:text-white hover:bg-red-600 rounded text-[10px] transition-colors cursor-pointer border border-red-200"
                            >
                              Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Input Oculto de Subida Directa */}
                <input
                  ref={directUploadInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleDirectUploadSelected}
                  className="hidden"
                />
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

                {/* ======================================================= */}
                {/* GESTIÓN DE VARIANTES DINÁMICAS (CRISTALES, COLORES, ETC)*/}
                <div className="p-4 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-cirqa-negro block">
                      Variantes del Producto ({editVariants.length} configuradas)
                    </span>
                    <span className="text-[10px] text-cirqa-negro/50 font-light">
                      El orden, fotos y variantes se gestionan directamente arriba en "Variantes y Fotos del Producto".
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-cirqa-negro/70 whitespace-nowrap">Selector en Tienda:</span>
                    <input
                      type="text"
                      value={editVariantAxisTitle}
                      onChange={(e) => setEditVariantAxisTitle(e.target.value)}
                      placeholder="Seleccionar Cristal Circadiano"
                      className="px-3 py-1.5 rounded-xl border border-cirqa-negro/15 bg-white text-xs text-cirqa-negro focus:outline-none focus:border-cirqa-primario"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-cirqa-negro/10">
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(selectedProduct)}
                    disabled={saving || uploadingGallery}
                    className="px-4 py-2.5 rounded-full border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs active:scale-95"
                    title="Eliminar este producto permanentemente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Producto</span>
                  </button>

                  <div className="flex items-center justify-end gap-3">
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
