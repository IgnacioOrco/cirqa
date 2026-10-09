import { formatMediaUrl } from '../services/api';
import { getProductImage as getStudioProductImage } from '../data/productImages';
import { MODELS } from '../data/models';

export const FALLBACK_IMAGE = '/products/_DSC8649.webp';

/**
 * Normaliza cualquier URL de imagen del backend (ej: /uploads/...)
 * para asegurar resolución absoluta en producción (Vercel) o local.
 */
export const normalizeImageUrl = (url) => {
  if (!url) return FALLBACK_IMAGE;
  return formatMediaUrl(url);
};

/**
 * Obtiene el código clásico o slug normalizado (q001..q005, qkids)
 * para enlazar con las especificaciones y fotografía de estudio si aplica.
 */
export const getClassicModelKey = (product) => {
  if (!product) return null;
  const raw = `${product.modelCode || ''} ${product.slug || ''} ${product.name || ''} ${product.id || ''}`.toLowerCase();
  if (raw.includes('q001') || raw.includes('q-001') || raw.includes('q 001')) return 'q001';
  if (raw.includes('q002') || raw.includes('q-002') || raw.includes('q 002')) return 'q002';
  if (raw.includes('q003') || raw.includes('q-003') || raw.includes('q 003')) return 'q003';
  if (raw.includes('q004') || raw.includes('q-004') || raw.includes('q 004')) return 'q004';
  if (raw.includes('q005') || raw.includes('q-005') || raw.includes('q 005')) return 'q005';
  if (raw.includes('kids') || raw.includes('qkids')) return 'qkids';
  return null;
};

/**
 * Regla 3: Ordenar galería de imágenes por 'order' ascendente
 * Normaliza URLs y estructura.
 */
export const getSortedProductImages = (product) => {
  if (!product) return [{ url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];

  if (Array.isArray(product.images) && product.images.length > 0) {
    const sorted = [...product.images]
      .filter((img) => img && (img.url || img.imageUrl))
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    if (sorted.length > 0) {
      return sorted.map((img, index) => ({
        _id: img._id || `img-${index}`,
        url: normalizeImageUrl(img.url || img.imageUrl),
        tag: img.tag || 'gallery',
        variantKey: img.variantKey || null,
        isPrimary: Boolean(img.isPrimary),
        isHover: Boolean(img.isHover || img.tag === 'hover'),
        order: Number(img.order) || index,
      }));
    }
  }

  // Retrocompatibilidad con image_url plano
  if (product.image_url) {
    return [
      {
        _id: 'primary-legacy',
        url: normalizeImageUrl(product.image_url),
        tag: 'front',
        variantKey: null,
        isPrimary: true,
        isHover: false,
        order: 0,
      },
    ];
  }

  // Fallback si es un modelo clásico con fotos de estudio (solo si NO tiene fotos en BD)
  const classicKey = getClassicModelKey(product);
  if (classicKey) {
    return [
      {
        _id: 'studio-perspectiva',
        url: getStudioProductImage(classicKey, 'dia', 'perspectiva'),
        tag: 'angle',
        isPrimary: true,
        isHover: false,
        order: 0,
      },
      {
        _id: 'studio-frente',
        url: getStudioProductImage(classicKey, 'dia', 'frente'),
        tag: 'front',
        isPrimary: false,
        isHover: true,
        order: 1,
      },
      {
        _id: 'studio-cenital',
        url: getStudioProductImage(classicKey, 'dia', 'cenital'),
        tag: 'detail',
        isPrimary: false,
        isHover: false,
        order: 2,
      },
    ];
  }

  return [{ _id: 'fallback', url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, isHover: false, order: 0 }];
};

/**
 * Regla 1: Selección Determinista de Portada
 * Prioridad Absoluta a MongoDB:
 * 1°: Imagen con isPrimary === true.
 * 2°: Si ninguna tiene estrella, la primera imagen del array ordenado por order ascendente (Pos #1).
 * 3°: Fallback a product.image_url.
 * Solo si no hay imágenes en BD, fallback a modelo clásico o general.
 */
/**
 * Helper para verificar coincidencia entre variantKey de imagen y clave solicitada
 */
export const matchVariantKey = (vk, targetKey) => {
  if (!vk || !targetKey) return false;
  const v = vk.toString().toLowerCase().trim();
  const t = targetKey.toString().toLowerCase().trim();
  if (v === t) return true;

  const circadianMap = {
    dia: ['amarillo', 'foco', 'pantallas', 'dia'],
    transicion: ['ambar', 'ámbar', 'atardecer', 'naranja', 'transicion', 'transición'],
    noche: ['rojo', 'descanso', 'carmin', 'carmín', 'noche'],
    clear: ['transparente', 'neutro', 'blanco', 'clear'],
  };

  for (const [canonical, aliases] of Object.entries(circadianMap)) {
    if (aliases.includes(t) && (v === canonical || aliases.includes(v))) return true;
  }
  return v.includes(t) || t.includes(v);
};

/**
 * Regla 1: Selección Determinista de Portada
 * Prioridad Absoluta a MongoDB:
 * - Si variantKey está presente, prioriza foto de esa variante (isPrimary o front o primera).
 * - Si no, foto con isPrimary === true del producto.
 * - En su defecto, primera foto por 'order' ascendente.
 * - Anula cualquier fallback a modelos clásicos cuando existen fotos en MongoDB.
 */
export const getPrimaryProductImage = (product, variantKey = null) => {
  if (!product) return FALLBACK_IMAGE;

  // 1. Prioridad absoluta a MongoDB: si product.images contiene al menos una imagen
  if (Array.isArray(product.images) && product.images.length > 0) {
    const validImages = product.images.filter((img) => img && (img.url || img.imageUrl));
    if (validImages.length > 0) {
      // Si se especificó una variante, buscar primero en sus fotos
      if (variantKey) {
        const variantImages = validImages.filter((img) => matchVariantKey(img.variantKey, variantKey));
        if (variantImages.length > 0) {
          const varPrimary = variantImages.find((img) => Boolean(img.isPrimary));
          if (varPrimary) return normalizeImageUrl(varPrimary.url || varPrimary.imageUrl);

          const varFront = variantImages.find((img) => img.tag === 'front');
          if (varFront) return normalizeImageUrl(varFront.url || varFront.imageUrl);

          const sortedVar = [...variantImages].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
          return normalizeImageUrl(sortedVar[0].url || sortedVar[0].imageUrl);
        }
      }

      // Si no hay variante o no tiene fotos propias, buscar en fotos generales del producto
      const primaryImg = validImages.find((img) => Boolean(img.isPrimary));
      if (primaryImg) {
        return normalizeImageUrl(primaryImg.url || primaryImg.imageUrl);
      }

      const frontImg = validImages.find((img) => img.tag === 'front');
      if (frontImg) {
        return normalizeImageUrl(frontImg.url || frontImg.imageUrl);
      }

      // Primera imagen del array ordenado por order ascendente (Pos #1)
      const sorted = [...validImages].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      return normalizeImageUrl(sorted[0].url || sorted[0].imageUrl);
    }
  }

  // 2. Fallback a product.image_url plano
  if (product.image_url) {
    return normalizeImageUrl(product.image_url);
  }

  // 3. Fallback solo si NO tiene ninguna foto en MongoDB
  const classicKey = getClassicModelKey(product);
  if (classicKey) {
    const canonicalKey = variantKey ? (['clear', 'dia', 'transicion', 'noche'].find((k) => matchVariantKey(k, variantKey)) || 'dia') : 'dia';
    return getStudioProductImage(classicKey, canonicalKey, 'perspectiva');
  }

  return FALLBACK_IMAGE;
};

/**
 * Regla 2: Selección Determinista de Hover (Foto Lateral/Perfil del MISMO Modelo y Variante)
 * Prioridad Absoluta a MongoDB:
 * 1°: Foto de la variante con tag === 'side' o 'angle' o isHover.
 * 2°: Foto general del MISMO producto con tag === 'side' o 'angle' o isHover.
 * 3°: Segunda imagen del mismo producto (distinta a la primaria).
 * 4°: Si sólo hay una foto, mantener la foto primaria (jamás mezclar otro producto).
 */
export const getHoverProductImage = (product, primaryUrl = null, variantKey = null) => {
  if (!product) return FALLBACK_IMAGE;
  const resolvedPrimary = primaryUrl || getPrimaryProductImage(product, variantKey);

  // 1. Prioridad absoluta a MongoDB
  if (Array.isArray(product.images) && product.images.length > 0) {
    const validImages = product.images.filter((img) => img && (img.url || img.imageUrl));
    if (validImages.length > 0) {
      // A. Buscar en fotos de la misma variante
      if (variantKey) {
        const variantImages = validImages.filter((img) => matchVariantKey(img.variantKey, variantKey));
        if (variantImages.length > 0) {
          const varSide = variantImages.find(
            (img) => (img.tag === 'side' || img.tag === 'angle' || Boolean(img.isHover) || img.tag === 'hover') &&
              normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary
          );
          if (varSide) return normalizeImageUrl(varSide.url || varSide.imageUrl);

          const varAlt = variantImages.find((img) => normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary);
          if (varAlt) return normalizeImageUrl(varAlt.url || varAlt.imageUrl);
        }
      }

      // B. Buscar foto lateral/perfil o hover general del MISMO producto
      const sideImg = validImages.find(
        (img) => (img.tag === 'side' || img.tag === 'angle' || Boolean(img.isHover) || img.tag === 'hover') &&
          normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary
      );
      if (sideImg) {
        return normalizeImageUrl(sideImg.url || sideImg.imageUrl);
      }

      // C. Segunda imagen ordenada del MISMO producto
      const sorted = [...validImages].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      if (sorted.length > 1) {
        const secondUrl = normalizeImageUrl(sorted[1].url || sorted[1].imageUrl);
        if (secondUrl !== resolvedPrimary) {
          return secondUrl;
        }
        const anyAlt = sorted.find((img) => normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary);
        if (anyAlt) {
          return normalizeImageUrl(anyAlt.url || anyAlt.imageUrl);
        }
      }

      // D. Si el producto tiene una sola foto, mantener la primaria sin alterar
      return resolvedPrimary;
    }
  }

  // 2. Fallback de estudio solo si NO tiene ninguna foto en MongoDB
  const classicKey = getClassicModelKey(product);
  if (classicKey) {
    const canonicalKey = variantKey ? (['clear', 'dia', 'transicion', 'noche'].find((k) => matchVariantKey(k, variantKey)) || 'dia') : 'dia';
    const frente = getStudioProductImage(classicKey, canonicalKey, 'frente');
    if (frente !== resolvedPrimary) return frente;
    return getStudioProductImage(classicKey, canonicalKey, 'cenital');
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

  const classicKey = getClassicModelKey(p);
  const classicMatch = classicKey ? MODELS.find((m) => m.id === classicKey) : null;

  const id = p._id || p.id || (classicMatch ? classicMatch.id : 'cirqa-item');
  const modelCode = p.modelCode || p.code || classicMatch?.code || 'CIRQA-Q001';
  const name = p.name || classicMatch?.name || 'Modelo CIRQA';
  const title = classicMatch?.title || p.title || 'Classic Minimalist';
  const price = typeof p.price === 'number' ? p.price : (classicMatch?.price || 0);
  const formattedPrice = `$ ${price.toLocaleString('es-AR')}`;
  const stock = typeof p.stock === 'number' ? p.stock : (classicMatch?.stock || 0);
  const isActive = p.isActive !== undefined ? p.isActive : true;
  const description = p.description || classicMatch?.description || 'Ingeniería óptica y diseño atemporal CIRQA.';

  let hasVariants = p.hasVariants;
  let variantAxisTitle = p.variantAxisTitle || 'Seleccionar Variante';
  let variants = Array.isArray(p.variants) ? p.variants : [];

  if (!variants || variants.length === 0) {
    hasVariants = true;
    variantAxisTitle = 'Seleccionar Cristal Circadiano';
    variants = DEFAULT_CIRCADIAN_VARIANTS;
  } else if (hasVariants === undefined) {
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
    variantAxisTitle,
    variants,
    material: p.material || classicMatch?.material || 'Acetato de alta densidad y aleación aeroespacial',
    frameShape: p.frameShape || classicMatch?.frameShape || 'Diseño Ergonómico CIRQA',
    lensWidth: p.lensWidth || classicMatch?.lensWidth || 50,
    bridgeWidth: p.bridgeWidth || classicMatch?.bridgeWidth || 19,
    templeLength: p.templeLength || classicMatch?.templeLength || 142,
    lensDefault: p.lensDefault || classicMatch?.lensDefault || 'dia',
    images: sortedImages,
    primaryImage,
    hoverImage,
    classicKey,
  };
};
