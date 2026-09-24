/**
 * CIRQA API Client & Services
 * Capa de red centralizada con cliente Fetch resiliente, inyección automática de JWT
 * y manejo global de errores 401/403 (sesión expirada).
 */

// 1. Resolución y normalización de la URL base
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'https://api.cirqa.com.ar/api';
  const cleanUrl = envUrl.replace(/\/+$/, '');
  // Asegurar que termine en /api sin duplicar
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

export const API_BASE_URL = getBaseUrl();

// Claves de almacenamiento local
export const STORAGE_KEYS = {
  TOKEN: 'cirqa_token',
  ADMIN: 'cirqa_admin',
};

/**
 * Limpia las credenciales y redirige a /login si la sesión expiró.
 */
export const handleSessionExpired = (redirect = true) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ADMIN);
    if (redirect && window.location.pathname !== '/login') {
      window.location.href = '/login?expired=1';
    }
  }
};

/**
 * Cliente HTTP Base basado en Fetch (Fetch Wrapper)
 */
async function request(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TOKEN) : null;

  // Normalizar endpoint: permitir "/products" o "products"
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  // Configurar headers por defecto
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Interceptor: Adjuntar Authorization Bearer si existe token
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    // Interceptor: Manejo de sesión no autorizada (401 / 403)
    if (response.status === 401 || response.status === 403) {
      // Solo forzamos logout automático si no es la propia petición de login
      if (!cleanEndpoint.includes('/auth/login')) {
        handleSessionExpired(true);
      }
    }

    // Intentar parsear JSON de la respuesta
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      const error = new Error(
        data?.message || data?.error || `Error HTTP ${response.status}: ${response.statusText}`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Si fue error de red (backend caído, CORS, etc.)
    if (!error.status) {
      error.message = error.message || 'No fue posible conectar con el servidor. Revisa tu conexión.';
    }
    throw error;
  }
}

/**
 * Métodos HTTP estándar
 */
export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body, ...options }),
  patch: (endpoint, body, options) => request(endpoint, { method: 'PATCH', body, ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
};

/**
 * Servicio de Autenticación
 */
export const authService = {
  /**
   * Iniciar sesión con email y contraseña (POST /auth/login)
   */
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      if (data.admin) {
        localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(data.admin));
      }
    }
    return data;
  },

  /**
   * Verificar validez del token JWT del administrador (GET /auth/verify)
   */
  async verify() {
    return api.get('/auth/verify');
  },

  /**
   * Cerrar sesión en el frontend
   */
  logout() {
    handleSessionExpired(false);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  /**
   * Obtener token actual
   */
  getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TOKEN) : null;
  },

  /**
   * Obtener usuario admin guardado
   */
  getAdmin() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ADMIN);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};

/**
 * Servicio de Productos y Catálogo
 */
export const productService = {
  /**
   * Obtener catálogo de productos (GET /products)
   * @param {Object} params - { all: true } para obtener activos e inactivos en el admin
   */
  async getProducts(params = { all: true }) {
    const query = new URLSearchParams();
    if (params.all) query.append('all', 'true');
    if (params.sort) query.append('sort', params.sort);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/products${queryString}`);
    
    // Normalizar respuesta si viene como { success: true, data: [...] } o array directo
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  /**
   * Actualizar un producto por ID (PUT /products/:id)
   */
  async updateProduct(id, updateData) {
    return api.put(`/products/${id}`, updateData);
  },

  /**
   * Actualizar stock directamente (PATCH /products/:id/stock)
   */
  async updateStock(id, stock) {
    return api.patch(`/products/${id}/stock`, { stock: Number(stock) });
  },

  /**
   * Crear un nuevo producto (POST /products)
   */
  async createProduct(productData) {
    return api.post('/products', productData);
  },

  /**
   * Eliminar un producto (DELETE /products/:id)
   */
  async deleteProduct(id) {
    return api.delete(`/products/${id}`);
  },
};

export default api;
