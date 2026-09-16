import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Instagram, Mail, Sparkles } from 'lucide-react';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setLoading(true);
    setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('cirqa_leads') || '[]');
        saved.push({ email, date: new Date().toISOString() });
        localStorage.setItem('cirqa_leads', JSON.stringify(saved));
      } catch (err) {
        console.warn('Could not persist email locally', err);
      }
      setLoading(false);
      setSubscribed(true);
      setEmail('');
    }, 600);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#140D08] text-white flex flex-col justify-between overflow-hidden font-montserrat selection:bg-cirqa-arena selection:text-cirqa-negro">
      
      {/* Luces circadianas ambientales de fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Resplandor Ocaso / Primario superior */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[400px] sm:h-[550px] bg-gradient-to-b from-[#E84A0F]/20 via-[#4E120C]/30 to-transparent blur-[110px] rounded-full" />
        
        {/* Resplandor Carmín / Ámbar lateral */}
        <div className="absolute top-1/3 -left-48 w-[450px] h-[450px] bg-gradient-to-tr from-[#AC1917]/25 to-[#EFBA40]/15 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 -right-40 w-[450px] h-[450px] bg-gradient-to-bl from-[#EFBA40]/15 via-[#E4B070]/10 to-transparent blur-[130px] rounded-full" />
        
        {/* Trama sutil de textura */}
        <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Header Minimalista con Logo */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-10 sm:pt-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* CIRQA Wordmark Logo Vectorial Oficial */}
          <svg
            viewBox="0 0 612 179.15"
            className="h-7 sm:h-9 w-auto fill-white tracking-widest transition-opacity hover:opacity-90"
            aria-label="CIRQA"
          >
            <rect x="182.56" y="83.99" width="13.83" height="95.35"/>
            <path d="m420.83,166.79h-17.88c1.05-.86.79-.67,1.76-1.62,4.63-4.54,8.28-9.91,10.87-15.99,2.6-6.08,3.91-12.84,3.91-20.08s-1.32-13.99-3.91-20.08c-2.59-6.07-6.24-11.44-10.87-15.99-4.63-4.53-10.15-8.09-16.41-10.59-12.53-4.98-28.35-4.98-40.86,0-6.26,2.5-11.81,6.08-16.48,10.66-4.67,4.58-8.33,9.99-10.88,16.07-2.55,6.09-3.84,12.8-3.84,19.93s1.29,13.84,3.84,19.93c2.55,6.09,6.21,11.5,10.88,16.07,4.67,4.58,10.21,8.16,16.48,10.66,6.25,2.49,13.12,3.75,20.43,3.75.34,0,.67-.02,1.01-.02l45.25.02,6.7-12.72Zm-68.07-3.13c-4.59-1.86-8.65-4.5-12.05-7.87-3.41-3.37-6.1-7.36-7.99-11.87-1.89-4.49-2.85-9.48-2.85-14.82s.96-10.42,2.84-14.87c1.89-4.46,4.58-8.44,8-11.81,3.41-3.37,7.47-6.02,12.05-7.87,4.6-1.86,9.69-2.8,15.11-2.8s10.5.94,15.1,2.8c4.58,1.84,8.61,4.49,11.98,7.86,3.38,3.38,6.05,7.36,7.94,11.82,1.89,4.46,2.85,9.46,2.85,14.87s-.96,10.31-2.85,14.82c-1.89,4.5-4.56,8.5-7.94,11.88-3.36,3.36-7.4,6.01-11.98,7.86-9.21,3.71-21.01,3.71-30.2,0"/>
            <path d="m536.82,84.99h-13.68v10.38c-.71-.8-1.44-1.59-2.2-2.35-4.58-4.52-10.04-8.08-16.25-10.57-12.4-4.98-28.06-4.98-40.45,0-6.2,2.49-11.69,6.07-16.31,10.64-4.63,4.58-8.25,9.97-10.77,16.05-2.52,6.08-3.8,12.78-3.8,19.9s1.28,13.82,3.8,19.9c2.52,6.08,6.15,11.48,10.77,16.05,4.62,4.57,10.11,8.15,16.31,10.64,6.18,2.49,12.99,3.75,20.23,3.75s14.04-1.26,20.23-3.75c6.19-2.49,11.66-6.05,16.25-10.57.76-.76,1.49-1.54,2.2-2.35v16.67h.82s12.05,0,12.05,0h0s.98,0,.98,0l-.17-94.38Zm-17.85,58.77c-1.86,4.48-4.49,8.45-7.82,11.81-3.32,3.35-7.29,5.98-11.8,7.82-9.07,3.69-20.7,3.69-29.77,0-4.52-1.84-8.52-4.48-11.88-7.83-3.36-3.35-6.01-7.32-7.88-11.8-1.86-4.47-2.81-9.42-2.81-14.73s.94-10.36,2.8-14.78c1.86-4.44,4.51-8.39,7.88-11.74,3.36-3.35,7.36-5.99,11.87-7.82,4.54-1.85,9.55-2.78,14.89-2.78s10.35.93,14.88,2.78c4.51,1.83,8.48,4.46,11.81,7.81,3.33,3.36,5.96,7.32,7.82,11.75,1.86,4.43,2.8,9.41,2.8,14.78s-.94,10.25-2.8,14.73"/>
            <path d="m147.73,142.71c-.11.28-.21.56-.32.83-1.93,4.59-4.65,8.66-8.1,12.11-3.43,3.43-7.54,6.13-12.22,8.02-9.39,3.78-21.43,3.78-30.8,0-4.68-1.89-8.82-4.59-12.29-8.03-3.48-3.43-6.22-7.5-8.15-12.1-1.93-4.58-2.9-9.66-2.9-15.1s.98-10.62,2.9-15.16c1.93-4.55,4.67-8.6,8.16-12.04,3.48-3.44,7.62-6.14,12.29-8.02,4.69-1.89,9.88-2.85,15.41-2.85s10.71.96,15.4,2.85c4.67,1.88,8.78,4.58,12.22,8.01,3.45,3.45,6.17,7.5,8.1,12.05.07.16.12.32.19.48h14.1c-.54-1.9-1.18-3.75-1.94-5.53-2.6-6.11-6.29-11.52-10.95-16.09-4.66-4.56-10.22-8.14-16.53-10.66-12.62-5.02-28.55-5.02-41.16,0-6.31,2.52-11.9,6.12-16.6,10.73-4.71,4.61-8.39,10.05-10.96,16.18-2.57,6.13-3.87,12.88-3.87,20.06s1.3,13.93,3.87,20.06c2.57,6.13,6.26,11.57,10.96,16.18,4.7,4.61,10.28,8.22,16.6,10.73,6.29,2.51,13.21,3.78,20.58,3.78s14.28-1.27,20.58-3.78c6.3-2.51,11.86-6.1,16.53-10.66,4.66-4.57,8.35-9.98,10.95-16.09.82-1.91,1.49-3.9,2.06-5.94h-14.08Z"/>
            <path d="m304.9,179.15l-21.28-32.64-.15-.23.24-.13c2.66-1.45,5.11-3.18,7.29-5.15,3.63-3.28,6.47-7.16,8.45-11.53,1.98-4.38,2.99-9.19,2.99-14.31s-1.01-9.93-2.99-14.31c-1.98-4.37-4.82-8.25-8.45-11.53-3.61-3.27-7.89-5.83-12.73-7.61-3.77-1.39-8.09-2.26-12.41-2.55l-41.76-.11v100.1h13.93v-35.09l.39.26c2.58,1.73,5.43,3.18,8.47,4.3,4.71,1.73,10.14,2.65,15.7,2.65,2.36,0,4.71-.17,7-.5l.16-.02.09.13,18.43,28.27h16.63Zm-31.64-41.77c-3.24,1.21-6.84,1.82-10.68,1.82s-7.44-.61-10.67-1.82c-3.2-1.19-6.02-2.9-8.38-5.07-2.32-2.15-4.16-4.66-5.47-7.48l-.02-.05v-33.63h25.41l.59.02c3.28.14,6.47.75,9.22,1.78,3.22,1.2,6.06,2.92,8.44,5.09,2.38,2.17,4.25,4.73,5.56,7.63,1.31,2.87,1.97,6.07,1.97,9.5s-.66,6.7-1.96,9.54c-1.31,2.87-3.19,5.42-5.57,7.59-2.38,2.17-5.22,3.89-8.43,5.08"/>
          </svg>
        </div>

        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-cirqa-arena/80 font-medium border border-cirqa-arena/20 bg-[#201610]/60 backdrop-blur-md px-3.5 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-cirqa-primario animate-pulse" />
          Buenos Aires
        </div>
      </header>

      {/* Contenido Central */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-16 sm:py-20 flex flex-col items-center text-center">
        
        {/* Badge de Lanzamiento */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cirqa-arena/10 border border-cirqa-arena/30 text-cirqa-arena text-[11px] sm:text-[12px] tracking-[0.22em] uppercase font-medium mb-8 backdrop-blur-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cirqa-primario" />
          <span>Sincronización Circadiana · Lanzamiento Oficial</span>
        </motion.div>

        {/* Título Principal */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-white mb-6 leading-[1.08]"
        >
          Protegé tu enfoque.{' '}
          <span className="block font-normal text-transparent bg-clip-text bg-gradient-to-r from-cirqa-arena via-cirqa-primario to-cirqa-ambar">
            Próximamente.
          </span>
        </motion.h1>

        {/* Bajada / Manifiesto de Marca */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base sm:text-lg text-white/70 font-light max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Filtramos la luz que desincroniza tu biología para que tu ritmo natural haga el resto. 
          Estamos preparando la nueva experiencia digital de ingeniería óptica de precisión.
        </motion.p>

        {/* Indicador de 3 Espectros Circadianos */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-lg mb-12 p-3 sm:p-4 rounded-2xl bg-[#201610]/70 border border-white/10 backdrop-blur-md"
        >
          <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/[0.02]">
            <span className="w-2 h-2 rounded-full bg-cirqa-amarillo mb-2 shadow-[0_0_10px_#F3B93A]" />
            <span className="text-[10px] sm:text-[11px] font-medium tracking-widest text-white/90 uppercase">Día</span>
            <span className="text-[9px] text-white/40 tracking-wider font-light">Enfoque 480nm</span>
          </div>

          <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/[0.02]">
            <span className="w-2 h-2 rounded-full bg-cirqa-primario mb-2 shadow-[0_0_10px_#E84A0F]" />
            <span className="text-[10px] sm:text-[11px] font-medium tracking-widest text-white/90 uppercase">Transición</span>
            <span className="text-[9px] text-white/40 tracking-wider font-light">Equilibrio 550nm</span>
          </div>

          <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/[0.02]">
            <span className="w-2 h-2 rounded-full bg-cirqa-carmin mb-2 shadow-[0_0_10px_#AC1917]" />
            <span className="text-[10px] sm:text-[11px] font-medium tracking-widest text-white/90 uppercase">Noche</span>
            <span className="text-[9px] text-white/40 tracking-wider font-light">Melatonina 0% Azul</span>
          </div>
        </motion.div>

        {/* Formulario de Acceso Temprano */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full max-w-md mx-auto"
        >
          <AnimatePresence mode="wait">
            {!subscribed ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ingresá tu correo electrónico..."
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder:text-white/35 text-sm focus:outline-none focus:border-cirqa-arena focus:ring-1 focus:ring-cirqa-arena transition-all duration-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cirqa-primario hover:bg-[#ff5514] text-white text-sm font-medium tracking-wide shadow-[0_4px_20px_rgba(232,74,15,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Avisarme</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-3 p-4 rounded-xl bg-cirqa-arena/10 border border-cirqa-arena/40 text-cirqa-arena"
              >
                <CheckCircle2 className="w-5 h-5 text-cirqa-arena flex-shrink-0" />
                <span className="text-sm font-medium tracking-wide">
                  ¡Gracias! Te avisaremos ni bien abramos la tienda.
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[11px] text-white/40 mt-3 font-light">
            Sé el primero en acceder a las unidades de la primera edición y beneficios de lanzamiento.
          </p>
        </motion.div>

      </main>

      {/* Footer Minimalista */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 text-xs text-white/50 font-light">
        <div>
          © {new Date().getFullYear()} CIRQA® — Todos los derechos reservados.
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://instagram.com/cirqa.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-cirqa-arena transition-colors"
          >
            <Instagram className="w-4 h-4" />
            <span>@cirqa.ar</span>
          </a>

          <a
            href="mailto:contacto@cirqa.ar"
            className="hover:text-cirqa-arena transition-colors"
          >
            contacto@cirqa.ar
          </a>
        </div>
      </footer>

    </div>
  );
}
