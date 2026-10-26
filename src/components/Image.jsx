import React from 'react';
import { formatMediaUrl } from '../services/api';

/**
 * Componente <Image /> de alto rendimiento para CIRQA (estándar Core Web Vitals)
 * 
 * Cumple con los requerimientos de PageSpeed Insights Mobile:
 * - Soporte de `priority`: inyecta loading="eager", fetchpriority="high", decoding="sync" para LCP.
 * - Soporte de `loading="lazy"` por defecto con decoding="async" para imágenes fuera del viewport.
 * - Soporte de `sizes` descriptivo para selección de srcset y prevención de sobredescarga.
 * - Resolución automática de URLs relativas y URLs de API con fallback a placeholder SVG.
 * - Dimensiones explícitas para prevenir Cumulative Layout Shift (CLS = 0).
 */
export default function Image({
  src,
  alt = 'CIRQA Eyewear',
  sizes,
  srcSet,
  width,
  height,
  priority = false,
  loading,
  fetchPriority,
  decoding,
  className = '',
  style = {},
  fallbackSrc = '/placeholder-glass.svg',
  onError,
  ...props
}) {
  const resolvedSrc = formatMediaUrl(src);

  // Determinación de atributos de carga crítica o diferida
  const computedLoading = loading || (priority ? 'eager' : 'lazy');
  const computedFetchPriority = fetchPriority || (priority ? 'high' : 'auto');
  const computedDecoding = decoding || (priority ? 'sync' : 'async');

  const handleError = (e) => {
    if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
      e.currentTarget.src = fallbackSrc;
    }
    if (onError) {
      onError(e);
    }
  };

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      sizes={sizes}
      srcSet={srcSet}
      width={width}
      height={height}
      loading={computedLoading}
      fetchPriority={computedFetchPriority}
      decoding={computedDecoding}
      className={className}
      style={style}
      onError={handleError}
      {...props}
    />
  );
}
