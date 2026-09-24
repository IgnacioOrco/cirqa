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
  if (!product) return [{ url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, order: 0 }];

  if (Array.isArray(product.images) && product.images.length > 0) {
    const sorted = [...product.images]
      .filter((img) => img && (img.url || img.imageUrl))
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    if (sorted.length > 0) {
      return sorted.map((img, index) => ({
        _id: img._id || `img-${index}`,
        url: normalizeImageUrl(img.url || img.imageUrl),
        tag: img.tag || 'gallery',
        isPrimary: Boolean(img.isPrimary),
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
        isPrimary: true,
        order: 0,
      },
    ];
  }

  // Fallback si es un modelo clásico con fotos de estudio
  const classicKey = getClassicModelKey(product);
  if (classicKey) {
    return [
      {
        _id: 'studio-perspectiva',
        url: getStudioProductImage(classicKey, 'dia', 'perspectiva'),
        tag: 'angle',
        isPrimary: true,
        order: 0,
      },
      {
        _id: 'studio-frente',
        url: getStudioProductImage(classicKey, 'dia', 'frente'),
        tag: 'front',
        isPrimary: false,
        order: 1,
      },
      {
        _id: 'studio-cenital',
        url: getStudioProductImage(classicKey, 'dia', 'cenital'),
        tag: 'detail',
        isPrimary: false,
        order: 2,
      },
    ];
  }

  return [{ _id: 'fallback', url: FALLBACK_IMAGE, tag: 'front', isPrimary: true, order: 0 }];
};

/**
 * Regla 1: Foto de Portada / Card Principal
 * 1. isPrimary === true
 * 2. o primera de images ordenada por order
 * 3. o image_url
 * 4. o fallback visual elegante
 */
export const getPrimaryProductImage = (product) => {
  if (!product) return FALLBACK_IMAGE;

  if (Array.isArray(product.images) && product.images.length > 0) {
    const primaryImg = product.images.find((img) => img.isPrimary && img.url);
    if (primaryImg) {
      return normalizeImageUrl(primaryImg.url);
    }

    const sorted = [...product.images]
      .filter((img) => img && img.url)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    if (sorted.length > 0) {
      return normalizeImageUrl(sorted[0].url);
    }
  }

  if (product.image_url) {
    return normalizeImageUrl(product.image_url);
  }

  const classicKey = getClassicModelKey(product);
  if (classicKey) {
    return getStudioProductImage(classicKey, 'dia', 'perspectiva');
  }

  return FALLBACK_IMAGE;
};

/**
 * Regla 2: Foto Alternativa para Hover en Card
 * 1. Foto con tag === 'front' (o 'angle'/'side' si la principal ya es front) distinta a la principal
 * 2. O la segunda foto de images
 * 3. O vista frontal de estudio si aplica
 * 4. O la misma foto principal como fallback
 */
export const getHoverProductImage = (product, primaryUrl = null) => {
  if (!product) return FALLBACK_IMAGE;
  const resolvedPrimary = primaryUrl || getPrimaryProductImage(product);

  if (Array.isArray(product.images) && product.images.length > 1) {
    // Buscar foto con tag 'front' distinta a la principal
    const frontImg = product.images.find(
      (img) => img.url && img.tag === 'front' && normalizeImageUrl(img.url) !== resolvedPrimary
    );
    if (frontImg) return normalizeImageUrl(frontImg.url);

    // Buscar foto con tag 'angle' o 'side' distinta a la principal
    const alternateTagImg = product.images.find(
      (img) =>
        img.url &&
        (img.tag === 'angle' || img.tag === 'side' || img.tag === 'model') &&
        normalizeImageUrl(img.url) !== resolvedPrimary
    );
    if (alternateTagImg) return normalizeImageUrl(alternateTagImg.url);

    // Si no, tomar la 2da foto ordenada por order
    const sorted = [...product.images]
      .filter((img) => img && img.url)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    const secondImg = sorted.find((img) => normalizeImageUrl(img.url) !== resolvedPrimary);
    if (secondImg) return normalizeImageUrl(secondImg.url);
  }

  const classicKey = getClassicModelKey(product);
  if (classicKey) {
    const frente = getStudioProductImage(classicKey, 'dia', 'frente');
    if (frente !== resolvedPrimary) return frente;
    return getStudioProductImage(classicKey, 'dia', 'cenital');
  }

  return resolvedPrimary;
};

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
