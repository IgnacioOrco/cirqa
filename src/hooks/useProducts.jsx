import React, { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/api';
import { normalizeProduct, hasAdminImages } from '../utils/productImages';
import { MODELS } from '../data/models';

// Memoria caché en módulo y deduplicador de peticiones en vuelo
const productsCache = {
  all: null,
  public: null,
  timestamp: { all: 0, public: 0 },
  inFlight: { all: null, public: null },
};
const CACHE_TTL = 90 * 1000; // 90 segundos

async function getSharedProducts({ all = false, force = false } = {}) {
  const key = all ? 'all' : 'public';
  const now = Date.now();

  // Si existe en caché y no expiró, devolver inmediatamente
  if (!force && productsCache[key] && now - productsCache.timestamp[key] < CACHE_TTL) {
    return productsCache[key];
  }

  // Si ya hay una petición en vuelo para este key, reutilizar su promesa
  if (productsCache.inFlight[key]) {
    return productsCache.inFlight[key];
  }

  productsCache.inFlight[key] = (async () => {
    try {
      const data = await productService.getProducts({ all });
      let result;
      if (Array.isArray(data) && data.length > 0) {
        const validProducts = data.filter((p) => {
          if (!all && p.isActive === false) return false;
          return hasAdminImages(p);
        });
        result = validProducts.map(normalizeProduct);
      } else {
        result = MODELS.filter(hasAdminImages).map(normalizeProduct);
      }
      productsCache[key] = result;
      productsCache.timestamp[key] = Date.now();
      return result;
    } catch (err) {
      console.warn('[useProducts] Error al conectar con API CIRQA, usando fallback local:', err.message);
      const fallback = MODELS.filter(hasAdminImages).map(normalizeProduct);
      productsCache[key] = fallback;
      productsCache.timestamp[key] = Date.now();
      return fallback;
    } finally {
      productsCache.inFlight[key] = null;
    }
  })();

  return productsCache.inFlight[key];
}

/**
 * Hook para obtener la lista de productos dinámica desde MongoDB (/api/products).
 * Con deduplicación de peticiones en vuelo y caché en memoria para no saturar la red ni la API.
 */
export function useProducts({ all = false, autoFetch = true } = {}) {
  const key = all ? 'all' : 'public';
  const [products, setProducts] = useState(() => productsCache[key] || []);
  const [loading, setLoading] = useState(() => (productsCache[key] ? false : autoFetch));
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (force = false) => {
    if (!productsCache[key] || force) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await getSharedProducts({ all, force });
      setProducts(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [all, key]);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts(false);
    }
  }, [fetchProducts, autoFetch]);

  return {
    products,
    loading,
    error,
    refetch: () => fetchProducts(true),
  };
}

/**
 * Hook para obtener un producto individual por ID o Slug desde /api/products/:slug.
 *
 * @param {string} slugOrId
 */
export function useProduct(slugOrId) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(Boolean(slugOrId));
  const [error, setError] = useState(null);

  const fetchProduct = useCallback(async () => {
    if (!slugOrId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await productService.getProductById(slugOrId);
      if (data && hasAdminImages(data)) {
        setProduct(normalizeProduct(data));
      } else {
        // Buscar en MODELS como fallback solo si cuenta con fotos de admin
        const local = MODELS.find((m) => (m.id === slugOrId || m.code === slugOrId) && hasAdminImages(m));
        setProduct(local ? normalizeProduct(local) : null);
      }
    } catch (err) {
      console.warn(`[useProduct] Error al obtener producto '${slugOrId}':`, err.message);
      setError(err);
      const local = MODELS.find((m) => (m.id === slugOrId || m.code === slugOrId) && hasAdminImages(m));
      setProduct(local ? normalizeProduct(local) : null);
    } finally {
      setLoading(false);
    }
  }, [slugOrId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}

/**
 * Componente Skeleton Loader para tarjetas de producto individuales en carruseles y grillas.
 * Mantiene la estética minimalista y lujosa de CIRQA (bordes suaves, grises neutros).
 */
export function ProductCardSkeleton() {
  return (
    <div className="w-[300px] sm:w-[360px] md:w-[380px] flex-shrink-0 snap-start bg-[#FAF9F5] rounded-3xl p-6 sm:p-7 border border-cirqa-negro/10 flex flex-col justify-between shadow-xs animate-pulse select-none">
      {/* Top badges */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-20 bg-cirqa-surface rounded-full" />
          <div className="h-4 w-28 bg-cirqa-surface rounded-full" />
        </div>
        <div className="h-6 w-36 bg-cirqa-negro/10 rounded-md mb-2" />
        <div className="h-3 w-48 bg-cirqa-negro/5 rounded-md" />
      </div>

      {/* Main Image Stage Placeholder */}
      <div className="h-52 sm:h-56 my-4 rounded-2xl bg-cirqa-surface/60 flex items-center justify-center relative overflow-hidden">
        <div className="w-32 h-20 bg-cirqa-negro/5 rounded-xl" />
      </div>

      {/* Selector Pills Placeholder */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <div className="h-3 w-24 bg-cirqa-negro/10 rounded" />
          <div className="h-3 w-10 bg-cirqa-negro/10 rounded" />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-cirqa-surface border border-cirqa-negro/5" />
          ))}
        </div>
        <div className="pt-3 border-t border-cirqa-negro/5 flex justify-between">
          <div className="h-3 w-16 bg-cirqa-surface rounded" />
          <div className="h-3 w-16 bg-cirqa-surface rounded" />
          <div className="h-3 w-16 bg-cirqa-surface rounded" />
        </div>
        <div className="pt-3 border-t border-cirqa-negro/5 flex items-center justify-between">
          <div className="h-5 w-24 bg-cirqa-surface rounded" />
          <div className="h-8 w-28 bg-cirqa-negro/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default useProducts;
