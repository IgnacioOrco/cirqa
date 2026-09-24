import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { authService } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionNotice, setSessionNotice] = useState(null);

  // Detectar si el usuario fue redirigido porque la sesión expiró
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === '1') {
      setSessionNotice('Tu sesión ha expirado o el token ya no es válido. Por favor, ingresa nuevamente.');
    }

    // Si ya tiene token válido guardado, redirigir directo al admin
    if (authService.getToken()) {
      navigate('/admin', { replace: true });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSessionNotice(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const res = await authService.login(trimmedEmail, password);

      if (res.token) {
        // Redirigir al dashboard de administración tras login exitoso
        navigate('/admin', { replace: true });
      } else {
        throw new Error('La respuesta del servidor no incluyó un token de autenticación.');
      }
    } catch (err) {
      const message =
        err.status === 401
          ? 'Credenciales inválidas. Revisa el correo electrónico y la contraseña.'
          : err.message || 'No fue posible iniciar sesión. Por favor intenta nuevamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-cirqa-negro font-montserrat flex flex-col justify-between selection:bg-cirqa-arena selection:text-cirqa-negro">
      
      {/* Barra Superior Minimalista */}
      <header className="px-6 py-6 border-b border-cirqa-negro/5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 text-xs text-cirqa-negro/60 hover:text-cirqa-negro transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver a la tienda</span>
        </Link>
        <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-cirqa-primario">
          PANEL DE ADMINISTRACIÓN
        </span>
      </header>

      {/* Tarjeta de Autenticación */}
      <main className="flex items-center justify-center p-6 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md bg-white border border-cirqa-negro/10 rounded-3xl p-8 sm:p-10 shadow-xl relative"
        >
          {/* Brillo ambiental de marca */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-cirqa-surface rounded-full blur-3xl -z-10 opacity-80 pointer-events-none" />

          {/* Encabezado */}
          <div className="text-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.22em] text-cirqa-primario font-semibold block mb-2">
              ACCESO RESTRINGIDO
            </span>
            <h1 className="text-2xl sm:text-3xl font-light text-cirqa-negro tracking-tight">
              Ingresar a CIRQA
            </h1>
            <p className="text-xs text-cirqa-negro/60 font-light mt-1.5">
              Introduce tus credenciales autorizadas para gestionar el catálogo en producción.
            </p>
          </div>

          {/* Aviso de Sesión Expirada */}
          {sessionNotice && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs flex items-start gap-2.5"
            >
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <span className="leading-relaxed font-medium">{sessionNotice}</span>
            </motion.div>
          )}

          {/* Mensaje de Error */}
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

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Email */}
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
                  autoComplete="email"
                  placeholder="admin@cirqa.com.ar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-cirqa-surface/60 border border-cirqa-negro/10 focus:border-cirqa-negro focus:bg-white text-xs text-cirqa-negro placeholder-cirqa-negro/35 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/70 block mb-2">
                Contraseña
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-cirqa-negro/40 absolute left-4 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
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

            {/* Botón de Envío */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cirqa-negro hover:bg-cirqa-primario active:scale-[0.99] text-white text-xs font-bold tracking-widest uppercase py-4 rounded-full transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Autenticando...</span>
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

          {/* Pie de Seguridad */}
          <div className="mt-8 pt-6 border-t border-cirqa-negro/5 flex items-center justify-center gap-2 text-[11px] text-cirqa-negro/50">
            <ShieldCheck className="w-3.5 h-3.5 text-cirqa-primario" />
            <span>Autenticación segura JWT · CIRQA Backend</span>
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
