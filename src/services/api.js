/**
 * CIRQA API Client & Services
 * Capa de red centralizada con cliente Fetch, inyección automática de JWT
 * y manejo global de errores 401/403 (sesión expirada).
 */

// 1. Resolución y normalización de la URL base
export const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'https://api.cirqa.com.ar';
  return envUrl.replace(/\/+$/, '');
};

export const API_BASE_URL = getBaseUrl();

// Claves de almacenamiento local
export const STORAGE_KEYS = {
  TOKEN: 'cirqa_token',
  ADMIN: 'cirqa_admin',
};

/**
 * Limpia las credenciales y redirige a /login?expired=1 si la sesión expiró.
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
 * Normaliza endpoints y URLs para soportar tanto rutas absolutas "/api/..." como relativas "/..."
 * evitando duplicación de "/api" si la variable VITE_API_URL ya la incluye o la omite.
 */
const buildFullUrl = (endpoint) => {
  const baseUrl = getBaseUrl();
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (baseUrl.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.replace(/^\/api/, '');
  } else if (!baseUrl.endsWith('/api') && !cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = `/api${cleanEndpoint}`;
  }

  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Cliente HTTP Base basado en Fetch (Fetch Wrapper)
 */
async function request(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TOKEN) : null;
  const url = buildFullUrl(endpoint);

  // Headers por defecto
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Interceptor: Inyectar Authorization Bearer <token>
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

    // Interceptor: Manejo de sesión expirada o no autorizada (401 / 403)
    if (response.status === 401 || response.status === 403) {
      // No forzar redirección si la petición es el propio formulario de login
      if (!endpoint.includes('/auth/login')) {
        handleSessionExpired(true);
      }
    }

    // Parsear respuesta
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
    if (!error.status) {
      error.message = error.message || 'No fue posible conectar con el servidor de CIRQA. Revisa tu conexión.';
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
   * Iniciar sesión con email y contraseña: POST /api/auth/login
   * @returns {Promise<{ token: string, admin: Object }>}
   */
  async login(email, password) {
    const data = await api.post('/api/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      if (data.admin) {
        localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(data.admin));
      }
    }
    return data;
  },

  /**
   * Verificar validez del token JWT: GET /api/auth/verify
   */
  async verify() {
    return api.get('/api/auth/verify');
  },

  /**
   * Cerrar sesión en el frontend y limpiar storage
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
 * Servicio de Productos
 */
export const productService = {
  /**
   * Obtener catálogo de productos:
   * GET /api/products (Público)
   * GET /api/products?all=true (Admin)
   */
  async getProducts(params = { all: true }) {
    const query = new URLSearchParams();
    if (params.all) query.append('all', 'true');
    if (params.sort) query.append('sort', params.sort);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/api/products${queryString}`);
    
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  /**
   * Actualizar propiedades de un producto: PUT /api/products/:id
   * @param {string} id - MongoDB ObjectId
   * @param {Object} updateData - { price, stock, isActive, etc. }
   */
  async updateProduct(id, updateData) {
    return api.put(`/api/products/${id}`, updateData);
  },

  /**
   * Actualizar stock individual: PATCH /api/products/:id/stock
   */
  async updateStock(id, stock) {
    return api.patch(`/api/products/${id}/stock`, { stock: Number(stock) });
  },

  /**
   * Crear un nuevo producto: POST /api/products
   */
  async createProduct(productData) {
    return api.post('/api/products', productData);
  },

  /**
   * Eliminar un producto: DELETE /api/products/:id
   */
  async deleteProduct(id) {
    return api.delete(`/api/products/${id}`);
  },
};

export default api;
