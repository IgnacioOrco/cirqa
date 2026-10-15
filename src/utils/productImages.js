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
  const clean = String(key).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!clean || clean === 'null' || clean === 'undefined') return '';
  if (clean.includes('clear') || clean.includes('transp') || clean.includes('neutr')) return 'clear';
  if (clean.includes('dia') || clean.includes('day') || clean.includes('amarill') || clean.includes('yellow')) return 'dia';
  if (clean.includes('transic') || clean.includes('naranj') || clean.includes('orang') || clean.includes('amber')) return 'transicion';
  if (clean.includes('noch') || clean.includes('night') || clean.includes('roj') || clean.includes('red') || clean.includes('sunset')) return 'noche';
  return clean;
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
 * Auto-asigna claves de variante a imágenes huérfanas (sin variantKey)
 * emparejando fronts[i], angles[i] y models[i] con ['clear', 'dia', 'transicion', 'noche'][i].
 *
 * @param {Array} images - Array de imágenes del producto
 * @returns {Array} Array de imágenes con variantKey asignado
 */
export const autoAssignMissingVariantKeys = (images) => {
  if (!Array.isArray(images) || images.length === 0) return [];

  const hasOrphans = images.some(
    (img) => !img.variantKey || img.variantKey === 'null' || img.variantKey === 'undefined'
  );
  if (!hasOrphans) {
    return images;
  }

  const VARIANT_KEYS = ['clear', 'dia', 'transicion', 'noche'];
  const orphanImages = images.filter(
    (img) => !img.variantKey || img.variantKey === 'null' || img.variantKey === 'undefined'
  );

  let fronts = orphanImages.filter((img) => img.tag === 'front');
  // Si hay un solo 'front' (como en Q 002) o menos de 4 frentes, complementar con 'gallery'
  if (fronts.length <= 1) {
    const galleryFronts = orphanImages.filter(
      (img) => img.tag === 'gallery' && img.tag !== 'angle' && img.tag !== 'side' && img.tag !== 'model' && img.tag !== 'lifestyle'
    );
    fronts = [...fronts, ...galleryFronts];
  }

  const angles = orphanImages.filter(
    (img) => img.tag === 'angle' || img.tag === 'side' || img.tag === 'hover'
  );
  const models = orphanImages.filter(
    (img) => img.tag === 'model' || img.tag === 'lifestyle'
  );

  const assignedVariantMap = new Map();
  const assignedTagMap = new Map();

  VARIANT_KEYS.forEach((vKey, i) => {
    if (fronts[i]) {
      const key = fronts[i]._id || fronts[i].url;
      assignedVariantMap.set(key, vKey);
      assignedTagMap.set(key, 'front');
    }
    if (angles[i]) {
      const key = angles[i]._id || angles[i].url;
      assignedVariantMap.set(key, vKey);
      assignedTagMap.set(key, 'angle');
    }
    if (models[i]) {
      const key = models[i]._id || models[i].url;
      assignedVariantMap.set(key, vKey);
      assignedTagMap.set(key, 'model');
    }
  });

  return images.map((img) => {
    const key = img._id || img.url;
    if (assignedVariantMap.has(key)) {
      return {
        ...img,
        variantKey: assignedVariantMap.get(key),
        tag: assignedTagMap.get(key) || img.tag || 'gallery',
      };
    }
    return img;
  });
};

/**
 * Asignación Inteligente y Soporte Ilimitado de Fotos por Variante
 * @param {Object} product - Producto a inspeccionar
 * @param {string|null} variantKey - Clave de variante ('clear', 'dia', 'transicion', 'noche')
 * @param {Object} options - Opciones adicionales (forAdmin, allowFallback)
 * @returns {Array} Array de imágenes filtradas y ordenadas para la variante
 */
export const getImagesForVariant = (product, variantKey = null, options = {}) => {
  if (!product) {
    return [{ url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
  }

  const rawImages = Array.isArray(product.images) ? product.images : [];
  let allImages = rawImages
    .filter((img) => img && (img.url || img.imageUrl))
    .map((img, idx) => ({
      _id: img._id || `img-${idx}`,
      url: normalizeImageUrl(img.url || img.imageUrl),
      tag: img.tag || inferImageTag(img, idx),
      variantKey: img.variantKey && img.variantKey !== 'null' && img.variantKey !== 'undefined'
        ? normalizeVariantKey(img.variantKey)
        : null,
      isPrimary: Boolean(img.isPrimary),
      isHover: Boolean(img.isHover || img.tag === 'hover'),
      order: typeof img.order === 'number' ? img.order : idx,
    }));

  allImages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // 1. Normalizar targetKey = normalizeVariantKey(variantKey). Si !targetKey, devolver todas las imágenes ordenadas.
  const targetKey = normalizeVariantKey(variantKey);
  if (!targetKey) {
    if (allImages.length > 0) return allImages;
    if (product.image_url) {
      return [{ url: normalizeImageUrl(product.image_url), tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
    }
    return [{ url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
  }

  // 2. Filtrar las imágenes que ya tienen normalizeVariantKey(img.variantKey) === targetKey
  const strictMatches = allImages.filter(
    (img) => img.variantKey && normalizeVariantKey(img.variantKey) === targetKey
  );

  const rolePriority = (tag) => {
    if (tag === 'front') return 1;
    if (tag === 'angle' || tag === 'side' || tag === 'hover') return 2;
    if (tag === 'model' || tag === 'lifestyle') return 3;
    if (tag === 'gallery' || tag === 'detail') return 4;
    return 5;
  };

  // 3. Regla Principal (Sin límite de cantidad):
  // Si strictMatches.length > 0, devolver TODAS las imágenes de strictMatches ordenadas por rol
  // ('front' primero, luego 'angle'/'side', luego 'model'/'lifestyle', luego 'gallery') y por 'order'.
  // NUNCA recortar con .slice(0, 2).
  if (strictMatches.length > 0) {
    const sortedStrict = [...strictMatches].sort((a, b) => {
      const prioDiff = rolePriority(a.tag) - rolePriority(b.tag);
      if (prioDiff !== 0) return prioDiff;
      return (a.order ?? 0) - (b.order ?? 0);
    });
    return sortedStrict;
  }

  // 4. Regla de Emparejamiento por Rol para Imágenes sin variantKey (Fallback inteligente)
  const orphanImages = allImages.filter(
    (img) => !img.variantKey || !normalizeVariantKey(img.variantKey)
  );

  if (orphanImages.length > 0) {
    let fronts = orphanImages.filter((img) => img.tag === 'front');
    // Si hay un solo 'front' (como en Q 002) o menos de 4 frentes, complementar con 'gallery'
    if (fronts.length <= 1) {
      const galleryFronts = orphanImages.filter(
        (img) => img.tag === 'gallery' && img.tag !== 'angle' && img.tag !== 'side' && img.tag !== 'model' && img.tag !== 'lifestyle'
      );
      fronts = [...fronts, ...galleryFronts];
    }

    const angles = orphanImages.filter(
      (img) => img.tag === 'angle' || img.tag === 'side' || img.tag === 'hover'
    );
    const models = orphanImages.filter(
      (img) => img.tag === 'model' || img.tag === 'lifestyle'
    );

    const VARIANT_ORDER = ['clear', 'dia', 'transicion', 'noche'];
    let variantIndex = VARIANT_ORDER.indexOf(targetKey);
    if (variantIndex === -1 && Array.isArray(product.variants)) {
      variantIndex = product.variants.findIndex(
        (v) => normalizeVariantKey(v.key || v.name) === targetKey
      );
    }

    if (variantIndex >= 0) {
      const variantGroup = [];
      if (fronts[variantIndex]) variantGroup.push(fronts[variantIndex]);
      if (angles[variantIndex]) variantGroup.push(angles[variantIndex]);
      if (models[variantIndex]) variantGroup.push(models[variantIndex]);

      if (variantGroup.length > 0) {
        return variantGroup;
      }
    }
  }

  // Fallback si no hay imágenes para la variante puntual
  if (options.allowFallback === false || options.forAdmin) {
    return [];
  }

  // En la tienda pública, devolver como fallback la portada general si existe
  if (allImages.length > 0) {
    const primaryGeneral = allImages.find((img) => img.isPrimary) || allImages[0];
    return [primaryGeneral];
  }

  if (product.image_url) {
    return [{ url: normalizeImageUrl(product.image_url), tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
  }

  return [{ url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
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
      if (primaryImg) return normalizeImageUrl(primaryImg.url || primaryImg.imageUrl);

      const frontImg = validImages.find((img) => (img.tag || inferImageTag(img)) === 'front');
      if (frontImg) return normalizeImageUrl(frontImg.url || frontImg.imageUrl);

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
      // Hover: la que tenga isHover: true o tag === 'angle' o tag === 'side', o la segunda foto de esa variante
      const hoverImg = varImages.find(
        (img) => Boolean(img.isHover) && normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary
      );
      if (hoverImg) return normalizeImageUrl(hoverImg.url || hoverImg.imageUrl);

      const sideImg = varImages.find(
        (img) => {
          const tag = img.tag || inferImageTag(img);
          return (tag === 'angle' || tag === 'side') &&
            normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary;
        }
      );
      if (sideImg) return normalizeImageUrl(sideImg.url || sideImg.imageUrl);

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
      const hoverImg = validImages.find(
        (img) => Boolean(img.isHover) && normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary
      );
      if (hoverImg) return normalizeImageUrl(hoverImg.url || hoverImg.imageUrl);

      const sideImg = validImages.find(
        (img) => {
          const tag = img.tag || inferImageTag(img);
          return (tag === 'angle' || tag === 'side') &&
            normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary;
        }
      );
      if (sideImg) return normalizeImageUrl(sideImg.url || sideImg.imageUrl);

      const secondImg = validImages.find((img) => normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary);
      if (secondImg) return normalizeImageUrl(secondImg.url || secondImg.imageUrl);

      const sorted = [...validImages].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      if (sorted.length > 1) {
        const fallbackSecond = sorted.find((img) => normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary) || sorted[1];
        return normalizeImageUrl(fallbackSecond.url || fallbackSecond.imageUrl);
      }
    }
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
