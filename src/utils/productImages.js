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
      ((img.url && (img.url.includes('/uploads/') || img.url.startsWith('http') || img.url.startsWith('/'))) ||
        (img.imageUrl && (img.imageUrl.includes('/uploads/') || img.imageUrl.startsWith('http') || img.imageUrl.startsWith('/'))))
  );
  const hasUploadedDirect = Boolean(
    (product.image_url && (product.image_url.includes('/uploads/') || product.image_url.startsWith('http') || product.image_url.startsWith('/'))) ||
    (product.previewImage && (product.previewImage.includes('/uploads/') || product.previewImage.startsWith('http') || product.previewImage.startsWith('/')))
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
 * Variantes Activas de un Producto para la Tienda y el Configurador
 * REGLAS OBLIGATORIAS:
 * 1) Una variante SOLO se muestra si:
 *    a) Está activa en el producto (isAvailable !== false) Y
 *    b) Tiene al menos 1 foto propia asignada (img.variantKey === variant.key y img.tag !== 'model').
 * 2) El orden respeta estrictamente el campo 'order' de product.variants configurado en el Admin.
 * 3) Si un producto solo tiene fotos cargadas en 2 variantes (ej: Clear y Día),
 *    SOLO se retornan y renderizan esas 2 variantes.
 */
/**
 * Devuelve el color canónico exacto como se visualiza en el panel administrador:
 * Clear: #CBD5E1 | Día: #FACC15 | Transición: #FB923C | Noche: #F87171
 */
export const getVariantColor = (v) => {
  if (!v) return '#CBD5E1';
  const rawKey = typeof v === 'string' ? v : (v.key || v.id || v.name || '');
  const key = normalizeVariantKey(rawKey);

  if (typeof v === 'object' && v !== null) {
    const explicit = v.colorHex || v.badgeColor || v.color;
    if (
      explicit &&
      explicit !== '#FFFFFF' &&
      explicit !== '#ffffff' &&
      explicit !== '#E5E7EB' &&
      explicit !== 'transparent'
    ) {
      return explicit;
    }
  }

  switch (key) {
    case 'clear':
      return '#CBD5E1';
    case 'dia':
      return '#FACC15';
    case 'transicion':
      return '#FB923C';
    case 'noche':
      return '#F87171';
    default:
      return '#CBD5E1';
  }
};

/**
 * REGLA DE ORO DE VARIANTES:
 * 1) En el frontend SOLO se muestran y seleccionan variantes que tengan al menos
 *    UNA imagen real cargada (con tag distinto de 'model' y con variantKey matching).
 * 2) Si una variante no tiene fotos cargadas, se ignora completamente.
 * 3) Si un producto solo tiene fotos cargadas en 2 variantes (ej: Clear y Día),
 *    SOLO se retornan y renderizan esas 2 variantes.
 */
export const getActiveProductVariants = (product) => {
  if (!product) return [];

  const rawImages = Array.isArray(product.images) ? autoAssignMissingVariantKeys(product.images) : [];
  const declaredVariants = Array.isArray(product.variants) && product.variants.length > 0
    ? product.variants
    : [];

  if (declaredVariants.length > 0) {
    const activeWithPhotos = declaredVariants.filter((variant) => {
      if (variant.isAvailable === false) return false;
      const vKey = normalizeVariantKey(variant.key || variant.name);
      if (!vKey) return false;

      const hasPhoto = rawImages.some((img) => {
        if (!img || img.tag === 'model') return false;
        const imgVKey = normalizeVariantKey(img.variantKey || inferImageVariantKey(img));
        return imgVKey === vKey;
      });

      return hasPhoto;
    });

    if (activeWithPhotos.length > 0) {
      return [...activeWithPhotos]
        .map((v) => {
          const color = getVariantColor(v);
          return {
            ...v,
            colorHex: color,
            badgeColor: color,
          };
        })
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    }
  }

  // Si no hay variants explícitas en el documento, reconstruir a partir de las imágenes con fotos
  const foundKeys = new Set();
  rawImages.forEach((img) => {
    if (img && img.tag !== 'model') {
      const k = normalizeVariantKey(img.variantKey || inferImageVariantKey(img));
      if (k) foundKeys.add(k);
    }
  });

  if (foundKeys.size > 0) {
    const list = Array.from(foundKeys).map((k, idx) => {
      const preset = DEFAULT_CIRCADIAN_VARIANTS.find((v) => normalizeVariantKey(v.key) === k);
      const color = getVariantColor(k);
      return {
        key: k,
        name: preset ? preset.name : (k.charAt(0).toUpperCase() + k.slice(1)),
        subtitle: preset ? preset.subtitle : '',
        badgeColor: color,
        colorHex: color,
        order: idx,
        isAvailable: true,
      };
    });
    return list.sort((a, b) => a.order - b.order);
  }

  // Fallback para modelos clásicos con variantes predeterminadas
  const classicMatch = MODELS.find((m) => m.id === product.id || m.code === product.modelCode || m.name === product.name);
  if (classicMatch && Array.isArray(classicMatch.variants) && classicMatch.variants.length > 0) {
    return classicMatch.variants.map((v) => {
      const color = getVariantColor(v);
      return {
        ...v,
        colorHex: color,
        badgeColor: color,
      };
    });
  }

  return DEFAULT_CIRCADIAN_VARIANTS;
};

/**
 * Fotos Exclusivas por Variante + Fotos de Modelo Siempre al Final
 * PROHIBIDO limitar con .slice(0, 2): Devolver TODAS las fotos de la variante.
 *
 * Al seleccionar una variante (ej: clear):
 * 1. Filtrar todas las fotos donde normalizeVariantKey(img.variantKey) === normalizeVariantKey(variantKey) y img.tag !== 'model'.
 * 2. Ordenar esas fotos estrictamente por img.order (ascendente).
 * 3. Filtrar todas las imágenes de modelo del producto (img.tag === 'model'), ordenadas por su propio img.order (ascendente).
 * 4. Concatenar: [...fotosDeLaVarianteSeleccionada, ...fotosDeModelo].
 *
 * @param {Object} product - Producto a inspeccionar
 * @param {string|null} variantKey - Clave de variante ('clear', 'dia', 'transicion', 'noche')
 * @param {Object} options - Opciones adicionales
 * @returns {Array} Array de imágenes exclusivo y ordenado
 */
export const getImagesForVariant = (product, variantKey = null, options = {}) => {
  if (!product) {
    return [{ url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
  }

  const rawImages = Array.isArray(product.images) ? product.images : [];
  const normalizedImages = rawImages
    .filter((img) => img && (img.url || img.imageUrl))
    .map((img, idx) => {
      const explicitVK = img.variantKey && img.variantKey !== 'null' && img.variantKey !== 'undefined'
        ? normalizeVariantKey(img.variantKey)
        : null;
      const inferredVK = inferImageVariantKey(img);
      const resolvedVK = explicitVK || inferredVK || null;
      const explicitTag = img.tag || inferImageTag(img, idx);
      const isModel = explicitTag === 'model' || explicitTag === 'lifestyle';

      return {
        _id: img._id || `img-${idx}`,
        url: normalizeImageUrl(img.url || img.imageUrl),
        tag: isModel ? 'model' : explicitTag,
        variantKey: isModel ? null : resolvedVK,
        isPrimary: Boolean(img.isPrimary),
        isHover: Boolean(img.isHover || explicitTag === 'hover'),
        order: typeof img.order === 'number' ? img.order : idx,
      };
    });

  // Fotos de Modelo: Van SIEMPRE al final en todas las variantes
  const modelPhotos = normalizedImages
    .filter((img) => img.tag === 'model')
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  let targetKey = normalizeVariantKey(variantKey);

  // Si no se proveyó variantKey, tomar la primera variante activa que devuelva getActiveProductVariants
  if (!targetKey) {
    const activeVariants = getActiveProductVariants(product);
    if (activeVariants.length > 0) {
      targetKey = normalizeVariantKey(activeVariants[0].key);
    }
  }

  if (!targetKey) {
    if (normalizedImages.length > 0) return normalizedImages;
    if (product.image_url) {
      return [{ url: normalizeImageUrl(product.image_url), tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
    }
    return [{ url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
  }

  // 1. Filtrar fotos exclusivas de la variante seleccionada (img.tag !== 'model')
  const variantPhotos = normalizedImages
    .filter((img) => img.tag !== 'model' && normalizeVariantKey(img.variantKey) === targetKey)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  // 2. Si hay fotos propias de la variante, concatenar con fotos de modelo al final
  if (variantPhotos.length > 0) {
    return [...variantPhotos, ...modelPhotos];
  }

  // Fallback inteligente para fotos huérfanas sin variantKey en productos pre-migración
  const orphanImages = normalizedImages.filter((img) => img.tag !== 'model' && !img.variantKey);
  if (orphanImages.length > 0) {
    let fronts = orphanImages.filter((img) => img.tag === 'front');
    if (fronts.length <= 1) {
      const galleryFronts = orphanImages.filter((img) => img.tag === 'gallery');
      fronts = [...fronts, ...galleryFronts];
    }
    const angles = orphanImages.filter((img) => img.tag === 'angle' || img.tag === 'side' || img.tag === 'hover');

    const VARIANT_ORDER = ['clear', 'dia', 'transicion', 'noche'];
    let variantIndex = VARIANT_ORDER.indexOf(targetKey);
    if (variantIndex === -1 && Array.isArray(product.variants)) {
      variantIndex = product.variants.findIndex(
        (v) => normalizeVariantKey(v.key || v.name) === targetKey
      );
    }

    if (variantIndex >= 0) {
      const orphanGroup = [];
      if (fronts[variantIndex]) orphanGroup.push(fronts[variantIndex]);
      if (angles[variantIndex]) orphanGroup.push(angles[variantIndex]);
      if (orphanGroup.length > 0) {
        return [...orphanGroup, ...modelPhotos];
      }
    }
  }

  if (options.allowFallback === false || options.forAdmin) {
    return [];
  }

  if (modelPhotos.length > 0) {
    return modelPhotos;
  }

  if (normalizedImages.length > 0) {
    return normalizedImages;
  }

  if (product.image_url) {
    return [{ url: normalizeImageUrl(product.image_url), tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
  }

  return [{ url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, isHover: false, order: 0, variantKey: null }];
};

/**
 * Portada Determinista del Catálogo (ProductCard y Catalog):
 * Usa como variante inicial la primera variante activa que devuelva getActiveProductVariants(product).
 * La imagen principal de la card será la primera foto (order: 0 o isPrimary) de esa primera variante activa.
 */
export const getPrimaryProductImage = (product, variantKey = null) => {
  if (!product) return FALLBACK_IMAGE;

  let activeKey = variantKey ? normalizeVariantKey(variantKey) : null;
  if (!activeKey) {
    const activeVariants = getActiveProductVariants(product);
    if (activeVariants.length > 0) {
      activeKey = normalizeVariantKey(activeVariants[0].key);
    }
  }

  const varImages = getImagesForVariant(product, activeKey);
  if (varImages && varImages.length > 0) {
    const primaryImg = varImages.find((img) => Boolean(img.isPrimary)) || varImages[0];
    if (primaryImg) return normalizeImageUrl(primaryImg.url || primaryImg.imageUrl);
  }

  if (product.image_url) {
    return normalizeImageUrl(product.image_url);
  }

  return FALLBACK_IMAGE;
};

/**
 * Hover Determinista del Catálogo:
 * Usa como hover la segunda foto (order: 1 o isHover) de esa misma primera variante activa.
 */
export const getHoverProductImage = (product, primaryUrl = null, variantKey = null) => {
  if (!product) return FALLBACK_IMAGE;

  let activeKey = variantKey ? normalizeVariantKey(variantKey) : null;
  if (!activeKey) {
    const activeVariants = getActiveProductVariants(product);
    if (activeVariants.length > 0) {
      activeKey = normalizeVariantKey(activeVariants[0].key);
    }
  }

  const resolvedPrimary = primaryUrl || getPrimaryProductImage(product, activeKey);
  const varImages = getImagesForVariant(product, activeKey);

  if (varImages && varImages.length > 0) {
    // 1. Imagen marcada con isHover que sea distinta a la primaria
    const hoverImg = varImages.find(
      (img) => Boolean(img.isHover) && normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary
    );
    if (hoverImg) return normalizeImageUrl(hoverImg.url || hoverImg.imageUrl);

    // 2. Segunda foto de esa misma variante (order: 1)
    const secondImg = varImages.find(
      (img) => normalizeImageUrl(img.url || img.imageUrl) !== resolvedPrimary
    );
    if (secondImg) return normalizeImageUrl(secondImg.url || secondImg.imageUrl);

    if (varImages.length > 1) {
      return normalizeImageUrl(varImages[1].url || varImages[1].imageUrl);
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
  { key: 'clear', name: 'Clear', subtitle: 'USO DIARIO', colorHex: '#CBD5E1', badgeColor: '#CBD5E1', priceModifier: 0, isDefault: false },
  { key: 'dia', name: 'Día', subtitle: 'PANTALLAS · FOCO', colorHex: '#FACC15', badgeColor: '#FACC15', priceModifier: 0, isDefault: true },
  { key: 'transicion', name: 'Transición', subtitle: 'CAÍDA SOLAR', colorHex: '#FB923C', badgeColor: '#FB923C', priceModifier: 0, isDefault: false },
  { key: 'noche', name: 'Noche', subtitle: 'DESCANSO TOTAL', colorHex: '#F87171', badgeColor: '#F87171', priceModifier: 0, isDefault: false },
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
