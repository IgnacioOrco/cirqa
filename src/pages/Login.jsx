import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Obtener la URL base de la API desde la variable de entorno de Vite
    // Con fallback seguro al puerto 5000 en caso de no estar definida
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Limpiar barra final si la hubiera para evitar dobles barras en la ruta
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const loginEndpoint = `${cleanBaseUrl}/api/auth/login`;

    try {
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      }

      // Guardar el token JWT y los datos del admin en localStorage
      if (data.token) {
        localStorage.setItem('cirqa_token', data.token);
        if (data.admin) {
          localStorage.setItem('cirqa_admin', JSON.stringify(data.admin));
        }
        // Redirigir al panel de administración
        navigate('/admin');
      } else {
        throw new Error('La respuesta del servidor no incluyó un token de acceso válido.');
      }
    } catch (err) {
      setError(err.message || 'No fue posible conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-cirqa-negro font-montserrat flex flex-col justify-between selection:bg-cirqa-arena selection:text-cirqa-negro">
      
      {/* Minimalist Top Bar */}
      <header className="px-6 py-6 border-b border-cirqa-negro/5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 text-xs text-cirqa-negro/60 hover:text-cirqa-negro transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver a la tienda</span>
        </Link>
        <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-cirqa-primario">
          PANEL DE ADMINISTRACIÓN
        </span>
      </header>

      {/* Main Login Card */}
      <main className="flex items-center justify-center p-6 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md bg-white border border-cirqa-negro/10 rounded-3xl p-8 sm:p-10 shadow-xl relative"
        >
          {/* Subtle Ambient Brand Glow */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-cirqa-surface rounded-full blur-3xl -z-10 opacity-80 pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.22em] text-cirqa-primario font-semibold block mb-2">
              ACCESO RESTRINGIDO
            </span>
            <h1 className="text-2xl sm:text-3xl font-light text-cirqa-negro tracking-tight">
              Ingresar a CIRQA
            </h1>
            <p className="text-xs text-cirqa-negro/60 font-light mt-1.5">
              Introduce tus credenciales autorizadas para gestionar el catálogo.
            </p>
          </div>

          {/* Error Message Box */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-2xl bg-cirqa-carmin/5 border border-cirqa-carmin/20 text-cirqa-carmin text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/70 block mb-2">
                Correo Electrónico
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-cirqa-negro/40 absolute left-4 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="admin@cirqa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-cirqa-surface/60 border border-cirqa-negro/10 focus:border-cirqa-negro focus:bg-white text-xs text-cirqa-negro placeholder-cirqa-negro/35 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/70 block mb-2">
                Contraseña
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-cirqa-negro/40 absolute left-4 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-cirqa-surface/60 border border-cirqa-negro/10 focus:border-cirqa-negro focus:bg-white text-xs text-cirqa-negro placeholder-cirqa-negro/35 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1 text-cirqa-negro/40 hover:text-cirqa-negro transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cirqa-negro hover:bg-cirqa-primario active:scale-[0.99] text-white text-xs font-bold tracking-widest uppercase py-4 rounded-full transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verificando...</span>
                  </span>
                ) : (
                  <>
                    <span>INICIAR SESIÓN</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Badge Footer */}
          <div className="mt-8 pt-6 border-t border-cirqa-negro/5 flex items-center justify-center gap-2 text-[11px] text-cirqa-negro/50">
            <ShieldCheck className="w-3.5 h-3.5 text-cirqa-primario" />
            <span>Autenticación criptográfica JWT · CIRQA 2026</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] text-cirqa-negro/40 tracking-wider">
        CIRQA OPTICAL ARCHITECTURE & ESPECTRAL ENGINE
      </footer>

    </div>
  );
}
