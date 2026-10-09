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
export const getPrimaryProductImage = (product) => {
  if (!product) return FALLBACK_IMAGE;

  // 1. Prioridad absoluta a MongoDB: si product.images contiene al menos una imagen
  if (Array.isArray(product.images) && product.images.length > 0) {
    const validImages = product.images.filter((img) => img && (img.url || img.imageUrl));
    if (validImages.length > 0) {
      // 1°: Imagen con isPrimary === true
      const primaryImg = validImages.find((img) => Boolean(img.isPrimary));
      if (primaryImg) {
        return normalizeImageUrl(primaryImg.url || primaryImg.imageUrl);
      }

      // 2°: Primera imagen del array ordenado por order ascendente (Pos #1)
      const sorted = [...validImages].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      return normalizeImageUrl(sorted[0].url || sorted[0].imageUrl);
    }
  }

  // 3°: Fallback a product.image_url
  if (product.image_url) {
    return normalizeImageUrl(product.image_url);
  }

  // Fallback si no tiene fotos en MongoDB y coincide con modelo clásico
  const classicKey = getClassicModelKey(product);
  if (classicKey) {
    return getStudioProductImage(classicKey, 'dia', 'perspectiva');
  }

  return FALLBACK_IMAGE;
};

/**
 * Regla 2: Selección Determinista de Hover
 * Prioridad Absoluta a MongoDB:
 * 1°: Imagen con isHover === true (o tag === 'hover').
 * 2°: En su defecto, la segunda imagen de la lista ordenada (images[1]), siempre que sea distinta a la primaria.
 * 3°: Si el producto tiene una sola foto (o no hay otra distinta), mantener la foto primaria (sin cambio al hover).
 * Anula cualquier fallback estático o a modelos clásicos cuando existen fotos en MongoDB.
 */
export const getHoverProductImage = (product, primaryUrl = null) => {
  if (!product) return FALLBACK_IMAGE;
  const resolvedPrimary = primaryUrl || getPrimaryProductImage(product);

  // 1. Prioridad absoluta a MongoDB
  if (Array.isArray(product.images) && product.images.length > 0) {
    const validImages = product.images.filter((img) => img && (img.url || img.imageUrl));
    if (validImages.length > 0) {
      // 1°: Imagen con isHover === true (o tag === 'hover')
      const hoverImg = validImages.find((img) => Boolean(img.isHover) || img.tag === 'hover');
      if (hoverImg) {
        return normalizeImageUrl(hoverImg.url || hoverImg.imageUrl);
      }

      // Ordenar por orden ascendente
      const sorted = [...validImages].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

      // 2°: En su defecto, la segunda imagen de la lista ordenada (images[1]), siempre que sea distinta a la primaria
      if (sorted.length > 1) {
        const secondUrl = normalizeImageUrl(sorted[1].url || sorted[1].imageUrl);
        if (secondUrl !== resolvedPrimary) {
          return secondUrl;
        }
        // Si la segunda coincide con la primaria, buscar cualquier otra alternativa distinta
        const altImg = sorted.find((img) => normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary);
        if (altImg) {
          return normalizeImageUrl(altImg.url || altImg.imageUrl);
        }
      }

      // 3°: Si el producto tiene una sola foto, mantener la foto primaria (sin cambio al hover)
      return resolvedPrimary;
    }
  }

  // Fallback si no tiene fotos en MongoDB y coincide con modelo clásico
  const classicKey = getClassicModelKey(product);
  if (classicKey) {
    const frente = getStudioProductImage(classicKey, 'dia', 'frente');
    if (frente !== resolvedPrimary) return frente;
    return getStudioProductImage(classicKey, 'dia', 'cenital');
  }

  return resolvedPrimary;
};

/**
 * Resuelve de forma reactiva la imagen de producto correspondiente a un cristal
 * o variante seleccionada (tanto en Catálogo como en Pasarela/Carrusel).
 *
 * Prioridad de resolución:
 * 1. Prioridad Absoluta a MongoDB: si el producto tiene fotos cargadas, se busca por
 *    variantKey coincidente. Si no hay variante con foto propia, se devuelve
 *    determinísticamente la imagen de Hover (si isHovered) o la Portada.
 * 2. Si no hay fotos en MongoDB y es modelo clásico: fotografía de estudio.
 * 3. Fallback general elegante.
 */
export const resolveProductCardImage = (
  product,
  selectedKey = null,
  angle = 'perspectiva',
  isHovered = false
) => {
  if (!product) return FALLBACK_IMAGE;

  // 1. Prioridad absoluta a MongoDB: anular cualquier fallback estático si hay fotos cargadas
  if (Array.isArray(product.images) && product.images.length > 0) {
    const validImages = product.images.filter((img) => img && (img.url || img.imageUrl));
    if (validImages.length > 0) {
      if (selectedKey) {
        const rawKey = selectedKey.toString().toLowerCase().trim();
        let circadianKey = rawKey;
        if (['amarillo', 'foco', 'pantallas', 'dia'].includes(rawKey)) circadianKey = 'dia';
        else if (['ambar', 'ámbar', 'atardecer', 'naranja', 'transicion', 'transición'].includes(rawKey)) circadianKey = 'transicion';
        else if (['rojo', 'descanso', 'carmin', 'carmín', 'noche'].includes(rawKey)) circadianKey = 'noche';
        else if (['transparente', 'neutro', 'blanco', 'clear'].includes(rawKey)) circadianKey = 'clear';

        const matchedCustom = validImages.find((img) => {
          if (!img.variantKey) return false;
          const vk = img.variantKey.toString().toLowerCase().trim();
          return (
            vk === rawKey ||
            vk === circadianKey ||
            vk.includes(rawKey) ||
            rawKey.includes(vk) ||
            vk.includes(circadianKey) ||
            circadianKey.includes(vk)
          );
        });

        if (matchedCustom) {
          return normalizeImageUrl(matchedCustom.url || matchedCustom.imageUrl);
        }
      }

      // Si no hay variante específica asignada, retornar determinísticamente Hover o Portada de MongoDB
      if (isHovered) {
        return getHoverProductImage(product);
      }
      return getPrimaryProductImage(product);
    }
  }

  // 2. Retrocompatibilidad con image_url plano
  if (product.image_url) {
    return normalizeImageUrl(product.image_url);
  }

  // 3. Modelo clásico con fotografía de estudio circadiana (solo si NO tiene fotos en BD)
  const classicKey = product.classicKey || getClassicModelKey(product);
  if (classicKey) {
    const rawKey = (selectedKey || product.lensDefault || 'dia').toString().toLowerCase().trim();
    let circadianKey = rawKey;
    if (['amarillo', 'foco', 'pantallas', 'dia'].includes(rawKey)) circadianKey = 'dia';
    else if (['ambar', 'ámbar', 'atardecer', 'naranja', 'transicion', 'transición'].includes(rawKey)) circadianKey = 'transicion';
    else if (['rojo', 'descanso', 'carmin', 'carmín', 'noche'].includes(rawKey)) circadianKey = 'noche';
    else if (['transparente', 'neutro', 'blanco', 'clear'].includes(rawKey)) circadianKey = 'clear';

    const validCircadian = ['clear', 'dia', 'transicion', 'noche'].includes(circadianKey)
      ? circadianKey
      : (product.lensDefault || 'dia');
    const resolvedAngle = angle || (isHovered ? 'frente' : 'perspectiva');
    return getStudioProductImage(classicKey, validCircadian, resolvedAngle);
  }

  return FALLBACK_IMAGE;
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
