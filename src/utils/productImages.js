import { formatMediaUrl } from '../services/api';
import { MODELS } from '../data/models';

export const FALLBACK_IMAGE = '/placeholder-glass.svg';

/**
 * Normaliza cualquier URL de imagen del backend (ej: /uploads/...)
 * para asegurar resolución absoluta en producción (Vercel) o local.
 */
export const normalizeImageUrl = (url) => {
  if (!url) return FALLBACK_IMAGE;
  return formatMediaUrl(url);
};

/**
 * Normalizador universal de claves de variantes (remueve acentos, mayúsculas y espacios)
 */
export const normalizeVariantKey = (key) => {
  if (!key) return '';
  return key
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // día -> dia, transición -> transicion
};

/**
 * Helper para verificar coincidencia estricta y semántica entre variantKeys
 */
export const matchVariantKey = (keyA, keyB) => {
  if (!keyA || !keyB) return false;
  const a = normalizeVariantKey(keyA);
  const b = normalizeVariantKey(keyB);
  if (a === b) return true;

  const circadianMap = {
    dia: ['amarillo', 'foco', 'pantallas', 'dia', 'yellow', 'day'],
    transicion: ['ambar', 'atardecer', 'naranja', 'transicion', 'transition', 'amber', 'orange'],
    noche: ['rojo', 'descanso', 'carmin', 'noche', 'night', 'red'],
    clear: ['transparente', 'neutro', 'blanco', 'clear', 'transparent', 'cristal'],
  };

  for (const [canonical, aliases] of Object.entries(circadianMap)) {
    if ((a === canonical || aliases.includes(a)) && (b === canonical || aliases.includes(b))) return true;
  }
  return a.includes(b) || b.includes(a);
};

/**
 * Infiere la clave de variante (clear, dia, transicion, noche) de una foto
 * a partir de sus metadatos o del nombre de archivo físico cargado por la administración.
 */
export const inferImageVariantKey = (img) => {
  if (!img) return null;
  if (img.variantKey && img.variantKey !== 'null' && img.variantKey !== 'undefined') {
    return normalizeVariantKey(img.variantKey);
  }
  const url = (img.url || img.imageUrl || '').toLowerCase();

  // Mapeo preciso de fotos oficiales de CIRQA subidas por la administración:
  // Q-003: 8620/8685 = Clear, 8621/8686 = Día, 8622/8688 = Transición, 8624/8689 = Noche
  if (url.includes('8620') || url.includes('8685') || url.includes('clear') || url.includes('transparente') || url.includes('cristal')) {
    return 'clear';
  }
  if (url.includes('8621') || url.includes('8686') || url.includes('dia') || url.includes('amarill') || url.includes('yellow') || url.includes('foco')) {
    return 'dia';
  }
  if (url.includes('8622') || url.includes('8688') || url.includes('transicion') || url.includes('ambar') || url.includes('naranj') || url.includes('amber')) {
    return 'transicion';
  }
  if (url.includes('8624') || url.includes('8689') || url.includes('noche') || url.includes('rojo') || url.includes('red') || url.includes('descanso')) {
    return 'noche';
  }

  return null;
};

/**
 * Infiere el rol óptico (front, angle, side, model) de una imagen subida.
 */
export const inferImageTag = (img, index = 0) => {
  if (!img) return 'gallery';
  const existingTag = img.tag;
  if (existingTag && existingTag !== 'gallery') return existingTag;

  const url = (img.url || img.imageUrl || '').toLowerCase();
  if (
    url.includes('8620') ||
    url.includes('8621') ||
    url.includes('8622') ||
    url.includes('8624') ||
    url.includes('frente') ||
    url.includes('front')
  ) {
    return 'front';
  }
  if (
    url.includes('8685') ||
    url.includes('8686') ||
    url.includes('8688') ||
    url.includes('8689') ||
    url.includes('angulo') ||
    url.includes('angle') ||
    url.includes('perspectiva')
  ) {
    return 'angle';
  }
  if (url.includes('cirqa30') || url.includes('model') || url.includes('modelo')) {
    return 'model';
  }

  return existingTag || (index === 0 ? 'front' : 'gallery');
};

/**
 * Validador para determinar si un producto tiene imágenes legítimas
 * subidas por el panel administrador (en /uploads/ o URLs remotas).
 */
export const hasAdminImages = (product) => {
  if (!product) return false;
  const images = Array.isArray(product.images) ? product.images : [];
  const hasUploadedInGallery = images.some(
    (img) =>
      img &&
      ((img.url && (img.url.includes('/uploads/') || img.url.startsWith('http'))) ||
        (img.imageUrl && (img.imageUrl.includes('/uploads/') || img.imageUrl.startsWith('http'))))
  );
  const hasUploadedDirect = Boolean(
    product.image_url && (product.image_url.includes('/uploads/') || product.image_url.startsWith('http'))
  );
  return hasUploadedInGallery || hasUploadedDirect;
};

/**
 * Regla 3: Ordenar galería de imágenes por 'order' ascendente
 * Normaliza URLs, variantKey y estructura.
 */
export const getSortedProductImages = (product) => {
  if (!product) return [{ url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];

  if (Array.isArray(product.images) && product.images.length > 0) {
    const validRaw = product.images.filter((img) => img && (img.url || img.imageUrl));
    const sorted = [...validRaw].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    if (sorted.length > 0) {
      return sorted.map((img, index) => {
        const inferredVariant = inferImageVariantKey(img);
        const inferredTag = inferImageTag(img, index);
        const resolvedTag = img.tag && img.tag !== 'gallery' ? img.tag : inferredTag;
        const isFrontView = resolvedTag === 'front';

        return {
          _id: img._id || `img-${index}`,
          url: normalizeImageUrl(img.url || img.imageUrl),
          tag: resolvedTag,
          variantKey: inferredVariant || (img.variantKey && img.variantKey !== 'null' ? normalizeVariantKey(img.variantKey) : null),
          isPrimary: Boolean(img.isPrimary || (index === 0 && !sorted.some((x) => x.isPrimary))),
          isHover: Boolean(img.isHover || resolvedTag === 'hover' || (resolvedTag === 'angle' && !img.isPrimary)),
          order: Number(img.order) || index,
        };
      });
    }
  }

  // Retrocompatibilidad con image_url plano
  if (product.image_url) {
    const inferredVariant = inferImageVariantKey({ url: product.image_url });
    return [
      {
        _id: 'primary-legacy',
        url: normalizeImageUrl(product.image_url),
        tag: 'front',
        variantKey: inferredVariant || null,
        isPrimary: true,
        isHover: false,
        order: 0,
      },
    ];
  }

  return [{ _id: 'fallback', url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
};

/**
 * Asignación Inteligente y Fallback por Pares para Variantes de Producto
 * @param {Object} product - Producto a inspeccionar
 * @param {string|null} variantKey - Clave de variante ('clear', 'dia', 'transicion', 'noche')
 * @returns {Array} Array de imágenes filtradas y ordenadas para la variante
 */
export const getImagesForVariant = (product, variantKey = null) => {
  if (!product) {
    return [{ url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
  }

  const allImages = getSortedProductImages(product);
  if (!allImages || allImages.length === 0) {
    return [{ url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
  }

  const normKey = normalizeVariantKey(variantKey);

  // Caso A (Imágenes con variantKey asignado en DB):
  // Si el producto tiene al menos una imagen con img.variantKey definido en DB,
  // devolver estrictamente las imágenes donde normalizeVariantKey(img.variantKey) === normalizeVariantKey(variantKey).
  const rawImages = Array.isArray(product.images) ? product.images : [];
  const hasDbVariantKey = rawImages.some(
    (img) => img && img.variantKey && img.variantKey !== 'null' && String(img.variantKey).trim() !== ''
  );

  if (hasDbVariantKey) {
    const matched = allImages.filter(
      (img) => img.variantKey && normalizeVariantKey(img.variantKey) === normKey
    );
    if (matched.length > 0) {
      return matched;
    }
  }

  // Caso B (Productos en DB cuyas fotos aún no tienen variantKey):
  // Separar las fotos que NO son tag === 'model' (fotos de estudio del armazón, ordenadas por order)
  const studioImages = allImages.filter((img) => img.tag !== 'model');
  const modelImages = allImages.filter((img) => img.tag === 'model');

  // Si hay >= 8 fotos de estudio y ninguna tiene variantKey en DB,
  // repartirlas automáticamente en pares (Frente + Ángulo) según el orden de las 4 variantes circadianas:
  // 'clear' -> fotos de estudio índice 0 y 1 (más la 1ra foto model si existe)
  // 'dia' -> fotos de estudio índice 2 y 3 (más la 2da foto model si existe)
  // 'transicion' -> fotos de estudio índice 4 y 5 (más la 3ra foto model si existe)
  // 'noche' -> fotos de estudio índice 6 y 7 (más la 4ta foto model si existe)
  if (studioImages.length >= 8) {
    let pairIndices = [0, 1];
    let modelIndex = 0;

    if (normKey === 'clear') {
      pairIndices = [0, 1];
      modelIndex = 0;
    } else if (normKey === 'dia') {
      pairIndices = [2, 3];
      modelIndex = 1;
    } else if (normKey === 'transicion') {
      pairIndices = [4, 5];
      modelIndex = 2;
    } else if (normKey === 'noche') {
      pairIndices = [6, 7];
      modelIndex = 3;
    }

    const selectedStudio = pairIndices
      .map((idx) => studioImages[idx])
      .filter(Boolean);

    const result = [...selectedStudio];
    if (modelImages[modelIndex]) {
      result.push(modelImages[modelIndex]);
    }

    if (result.length > 0) {
      return result;
    }
  }

  // Si el producto tiene solo 2 fotos en total (como Q-004) o pocas fotos,
  // mostrar esas fotos para cualquier variante para que nunca quede el visor vacío.
  if (allImages.length <= 4 || studioImages.length < 8) {
    return allImages;
  }

  return allImages;
};

/**
 * Regla 1: Selección Determinista de Portada
 * Prioridad Absoluta a fotos de la variante activa cargadas por la administración:
 * - Si variantKey está presente, prioriza foto frontal (tag === 'front') o primaria de esa variante.
 * - Si no, foto con isPrimary === true del producto.
 * - En su defecto, primera foto por 'order' ascendente.
 */
export const getPrimaryProductImage = (product, variantKey = null) => {
  if (!product) return FALLBACK_IMAGE;

  if (variantKey) {
    const varImages = getImagesForVariant(product, variantKey);
    if (varImages && varImages.length > 0) {
      const varPrimary = varImages.find((img) => Boolean(img.isPrimary));
      if (varPrimary) return normalizeImageUrl(varPrimary.url || varPrimary.imageUrl);

      const varFront = varImages.find((img) => (img.tag || inferImageTag(img)) === 'front');
      if (varFront) return normalizeImageUrl(varFront.url || varFront.imageUrl);

      return normalizeImageUrl(varImages[0].url || varImages[0].imageUrl);
    }
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    const validImages = product.images.filter((img) => img && (img.url || img.imageUrl));
    if (validImages.length > 0) {
      const primaryImg = validImages.find((img) => Boolean(img.isPrimary));
      if (primaryImg) {
        return normalizeImageUrl(primaryImg.url || primaryImg.imageUrl);
      }

      const frontImg = validImages.find((img) => (img.tag || inferImageTag(img)) === 'front');
      if (frontImg) {
        return normalizeImageUrl(frontImg.url || frontImg.imageUrl);
      }

      const sorted = [...validImages].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      return normalizeImageUrl(sorted[0].url || sorted[0].imageUrl);
    }
  }

  if (product.image_url) {
    return normalizeImageUrl(product.image_url);
  }

  return FALLBACK_IMAGE;
};

/**
 * Regla 2: Selección Determinista de Hover (Foto Lateral/Perfil del MISMO Modelo y Variante)
 */
export const getHoverProductImage = (product, primaryUrl = null, variantKey = null) => {
  if (!product) return FALLBACK_IMAGE;
  const resolvedPrimary = primaryUrl || getPrimaryProductImage(product, variantKey);

  if (variantKey) {
    const varImages = getImagesForVariant(product, variantKey);
    if (varImages && varImages.length > 0) {
      const varSide = varImages.find(
        (img) => {
          const tag = img.tag || inferImageTag(img);
          return (tag === 'side' || tag === 'angle' || Boolean(img.isHover)) &&
            normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary;
        }
      );
      if (varSide) return normalizeImageUrl(varSide.url || varSide.imageUrl);

      const secondImg = varImages.find((img) => normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary);
      if (secondImg) return normalizeImageUrl(secondImg.url || secondImg.imageUrl);

      if (varImages.length > 1) {
        return normalizeImageUrl(varImages[1].url || varImages[1].imageUrl);
      }

      return normalizeImageUrl(varImages[0].url || varImages[0].imageUrl);
    }
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    const validImages = product.images.filter((img) => img && (img.url || img.imageUrl));
    if (validImages.length > 0) {
      const sideImg = validImages.find(
        (img) => {
          const tag = img.tag || inferImageTag(img);
          return (tag === 'side' || tag === 'angle' || Boolean(img.isHover)) &&
            normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary;
        }
      );
      if (sideImg) {
        return normalizeImageUrl(sideImg.url || sideImg.imageUrl);
      }

      const sorted = [...validImages].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      if (sorted.length > 1) {
        const secondImg = sorted.find((img) => normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary) || sorted[1];
        return normalizeImageUrl(secondImg.url || secondImg.imageUrl);
      }

      return resolvedPrimary;
    }
  }

  if (product.image_url) {
    return normalizeImageUrl(product.image_url);
  }

  return resolvedPrimary;
};

/**
 * Resuelve de forma reactiva la imagen de producto correspondiente a un cristal
 * o variante seleccionada (tanto en Catálogo como en Pasarela/Carrusel).
 */
export const resolveProductCardImage = (
  product,
  selectedKey = null,
  angle = 'perspectiva',
  isHovered = false
) => {
  if (!product) return FALLBACK_IMAGE;

  if (isHovered) {
    const primary = getPrimaryProductImage(product, selectedKey);
    return getHoverProductImage(product, primary, selectedKey);
  }

  return getPrimaryProductImage(product, selectedKey);
};

export const DEFAULT_CIRCADIAN_VARIANTS = [
  { key: 'clear', name: 'Clear', subtitle: 'USO DIARIO', badgeColor: '#E2E8F0', priceModifier: 0, isDefault: false },
  { key: 'dia', name: 'Día', subtitle: 'PANTALLAS · FOCO', badgeColor: '#F3B93A', priceModifier: 0, isDefault: true },
  { key: 'transicion', name: 'Transición', subtitle: 'CAÍDA SOLAR', badgeColor: '#D97706', priceModifier: 0, isDefault: false },
  { key: 'noche', name: 'Noche', subtitle: 'DESCANSO TOTAL', badgeColor: '#EF4444', priceModifier: 0, isDefault: false },
];

/**
 * Normaliza un producto proveniente de MongoDB a la estructura uniforme
 * consumida por todos los componentes del frontend de CIRQA.
 */
export const normalizeProduct = (p) => {
  if (!p) return null;

  const classicMatch = MODELS.find((m) => m.id === p.id || m.code === p.modelCode || m.name === p.name);

  const id = p._id || p.id || (classicMatch ? classicMatch.id : 'cirqa-item');
  const modelCode = p.modelCode || p.code || classicMatch?.code || 'CIRQA-Q003';
  const name = p.name || classicMatch?.name || 'Modelo CIRQA';
  const title = p.title || classicMatch?.title || name;
  const price = typeof p.price === 'number' ? p.price : (classicMatch?.price || 229000);
  const formattedPrice = `$ ${price.toLocaleString('es-AR')}`;
  const stock = typeof p.stock === 'number' ? p.stock : (classicMatch?.stock || 10);
  const isActive = p.isActive !== undefined ? p.isActive : true;
  const description = p.description || classicMatch?.description || '';

  let hasVariants = p.hasVariants;
  let variantAxisTitle = p.variantAxisTitle || 'Seleccionar Variante';
  let variants = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : DEFAULT_CIRCADIAN_VARIANTS;

  if (hasVariants === undefined) {
    hasVariants = true;
  }

  const sortedImages = getSortedProductImages(p);
  const primaryImage = getPrimaryProductImage(p);
  const hoverImage = getHoverProductImage(p, primaryImage);

  return {
    ...classicMatch,
    ...p,
    id,
    _id: id,
    name,
    title,
    modelCode,
    code: modelCode,
    slug: p.slug || id,
    price,
    formattedPrice,
    stock,
    isActive,
    description,
    hasVariants,
    variantAxisTitle: variantAxisTitle || 'Seleccionar Cristal Circadiano',
    variants,
    material: p.material || classicMatch?.material || 'Acetato de celulosa de alta densidad',
    frameShape: p.frameShape || classicMatch?.frameShape || 'Diseño Ergonómico CIRQA',
    lensWidth: p.lensWidth || classicMatch?.lensWidth || 53,
    bridgeWidth: p.bridgeWidth || classicMatch?.bridgeWidth || 19,
    templeLength: p.templeLength || classicMatch?.templeLength || 142,
    lensDefault: p.lensDefault || classicMatch?.lensDefault || 'dia',
    images: sortedImages,
    primaryImage,
    hoverImage,
  };
};
