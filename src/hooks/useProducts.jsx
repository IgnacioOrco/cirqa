import React, { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/api';
import { normalizeProduct } from '../utils/productImages';
import { MODELS } from '../data/models';

/**
 * Hook para obtener la lista de productos dinámica desde MongoDB (/api/products).
 * Soporta modo público (solo activos) y admin (all=true), manejo de estados de carga,
 * error y refetch para invalidación de caché reactiva.
 *
 * @param {Object} options
 * @param {boolean} options.all - Si es true consulta ?all=true
 * @param {boolean} options.autoFetch - Si debe ejecutar la consulta al montar el componente
 */
export function useProducts({ all = false, autoFetch = true } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getProducts({ all });
      if (Array.isArray(data) && data.length > 0) {
        const normalized = data.map(normalizeProduct);
        setProducts(normalized);
      } else {
        // Fallback seguro a modelos base si MongoDB no tiene productos aún
        const fallback = MODELS.map(normalizeProduct);
        setProducts(fallback);
      }
    } catch (err) {
      console.warn('[useProducts] Error al conectar con API CIRQA, usando fallback local:', err.message);
      setError(err);
      // Fallback a modelos estáticos para resiliencia total
      setProducts(MODELS.map(normalizeProduct));
    } finally {
      setLoading(false);
    }
  }, [all]);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [fetchProducts, autoFetch]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
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
      if (data) {
        setProduct(normalizeProduct(data));
      } else {
        // Buscar en MODELS como fallback
        const local = MODELS.find((m) => m.id === slugOrId || m.code === slugOrId);
        setProduct(local ? normalizeProduct(local) : null);
      }
    } catch (err) {
      console.warn(`[useProduct] Error al obtener producto '${slugOrId}':`, err.message);
      setError(err);
      const local = MODELS.find((m) => m.id === slugOrId || m.code === slugOrId);
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
    <div className="w-[300px] sm:w-[360px] md:w-[380px] flex-shrink-0 snap-start bg-white rounded-3xl p-6 sm:p-7 border border-cirqa-negro/10 flex flex-col justify-between shadow-sm animate-pulse select-none">
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
