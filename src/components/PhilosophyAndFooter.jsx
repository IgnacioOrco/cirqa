import React from 'react';

export default function PhilosophyAndFooter({ onOpenTrials, onOpenPrescription }) {
  return (
    <footer className="bg-white border-t border-cirqa-negro/10 py-16 text-cirqa-negro">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Col 1: Logo & Statement */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 612 179.15" className="h-5 w-auto fill-cirqa-negro">
              <rect x="182.56" y="83.99" width="13.83" height="95.35"/>
              <path d="m420.83,166.79h-17.88c1.05-.86.79-.67,1.76-1.62,4.63-4.54,8.28-9.91,10.87-15.99,2.6-6.08,3.91-12.84,3.91-20.08s-1.32-13.99-3.91-20.08c-2.59-6.07-6.24-11.44-10.87-15.99-4.63-4.53-10.15-8.09-16.41-10.59-12.53-4.98-28.35-4.98-40.86,0-6.26,2.5-11.81,6.08-16.48,10.66-4.67,4.58-8.33,9.99-10.88,16.07-2.55,6.09-3.84,12.8-3.84,19.93s1.29,13.84,3.84,19.93c2.55,6.09,6.21,11.5,10.88,16.07,4.67,4.58,10.21,8.16,16.48,10.66,6.25,2.49,13.12,3.75,20.43,3.75.34,0,.67-.02,1.01-.02l45.25.02,6.7-12.72Zm-68.07-3.13c-4.59-1.86-8.65-4.5-12.05-7.87-3.41-3.37-6.1-7.36-7.99-11.87-1.89-4.49-2.85-9.48-2.85-14.82s.96-10.42,2.84-14.87c1.89-4.46,4.58-8.44,8-11.81,3.41-3.37,7.47-6.02,12.05-7.87,4.6-1.86,9.69-2.8,15.11-2.8s10.5.94,15.1,2.8c4.58,1.84,8.61,4.49,11.98,7.86,3.38,3.38,6.05,7.36,7.94,11.82,1.89,4.46,2.85,9.46,2.85,14.87s-.96,10.31-2.85,14.82c-1.89,4.5-4.56,8.5-7.94,11.88-3.36,3.36-7.4,6.01-11.98,7.86-9.21,3.71-21.01,3.71-30.2,0"/>
              <path d="m536.82,84.99h-13.68v10.38c-.71-.8-1.44-1.59-2.2-2.35-4.58-4.52-10.04-8.08-16.25-10.57-12.4-4.98-28.06-4.98-40.45,0-6.2,2.49-11.69,6.07-16.31,10.64-4.63,4.58-8.25,9.97-10.77,16.05-2.52,6.08-3.8,12.78-3.8,19.9s1.28,13.82,3.8,19.9c2.52,6.08,6.15,11.48,10.77,16.05,4.62,4.57,10.11,8.15,16.31,10.64,6.18,2.49,12.99,3.75,20.23,3.75s14.04-1.26,20.23-3.75c6.19-2.49,11.66-6.05,16.25-10.57.76-.76,1.49-1.54,2.2-2.35v16.67h.82s12.05,0,12.05,0h0s.98,0,.98,0l-.17-94.38Zm-17.85,58.77c-1.86,4.48-4.49,8.45-7.82,11.81-3.32,3.35-7.29,5.98-11.8,7.82-9.07,3.69-20.7,3.69-29.77,0-4.52-1.84-8.52-4.48-11.88-7.83-3.36-3.35-6.01-7.32-7.88-11.8-1.86-4.47-2.81-9.42-2.81-14.73s.94-10.36,2.8-14.78c1.86-4.44,4.51-8.39,7.88-11.74,3.36-3.35,7.36-5.99,11.87-7.82,4.54-1.85,9.55-2.78,14.89-2.78s10.35.93,14.88,2.78c4.51,1.83,8.48,4.46,11.81,7.81,3.33,3.36,5.96,7.32,7.82,11.75,1.86,4.43,2.8,9.41,2.8,14.78s-.94,10.25-2.8,14.73"/>
              <path d="m147.73,142.71c-.11.28-.21.56-.32.83-1.93,4.59-4.65,8.66-8.1,12.11-3.43,3.43-7.54,6.13-12.22,8.02-9.39,3.78-21.43,3.78-30.8,0-4.68-1.89-8.82-4.59-12.29-8.03-3.48-3.43-6.22-7.5-8.15-12.1-1.93-4.58-2.9-9.66-2.9-15.1s.98-10.62,2.9-15.16c1.93-4.55,4.67-8.6,8.16-12.04,3.48-3.44,7.62-6.14,12.29-8.02,4.69-1.89,9.88-2.85,15.41-2.85s10.71.96,15.4,2.85c4.67,1.88,8.78,4.58,12.22,8.01,3.45,3.45,6.17,7.5,8.1,12.05.07.16.12.32.19.48h14.1c-.54-1.9-1.18-3.75-1.94-5.53-2.6-6.11-6.29-11.52-10.95-16.09-4.66-4.56-10.22-8.14-16.53-10.66-12.62-5.02-28.55-5.02-41.16,0-6.31,2.52-11.9,6.12-16.6,10.73-4.71,4.61-8.39,10.05-10.96,16.18-2.57,6.13-3.87,12.88-3.87,20.06s1.3,13.93,3.87,20.06c2.57,6.13,6.26,11.57,10.96,16.18,4.7,4.61,10.28,8.22,16.6,10.73,6.29,2.51,13.21,3.78,20.58,3.78s14.28-1.27,20.58-3.78c6.3-2.51,11.86-6.1,16.53-10.66,4.66-4.57,8.35-9.98,10.95-16.09.82-1.91,1.49-3.9,2.06-5.94h-14.08Z"/>
              <path d="m304.9,179.15l-21.28-32.64-.15-.23.24-.13c2.66-1.45,5.11-3.18,7.29-5.15,3.63-3.28,6.47-7.16,8.45-11.53,1.98-4.38,2.99-9.19,2.99-14.31s-1.01-9.93-2.99-14.31c-1.98-4.37-4.82-8.25-8.45-11.53-3.61-3.27-7.89-5.83-12.73-7.61-3.77-1.39-8.09-2.26-12.41-2.55l-41.76-.11v100.1h13.93v-35.09l.39.26c2.58,1.73,5.43,3.18,8.47,4.3,4.71,1.73,10.14,2.65,15.7,2.65,2.36,0,4.71-.17,7-.5l.16-.02.09.13,18.43,28.27h16.63Zm-31.64-41.77c-3.24,1.21-6.84,1.82-10.68,1.82s-7.44-.61-10.67-1.82c-3.2-1.19-6.02-2.9-8.38-5.07-2.32-2.15-4.16-4.66-5.47-7.48l-.02-.05v-33.63h25.41l.59.02c3.28.14,6.47.75,9.22,1.78,3.22,1.2,6.06,2.92,8.44,5.09,2.38,2.17,4.25,4.73,5.56,7.63,1.31,2.87,1.97,6.07,1.97,9.5s-.66,6.7-1.96,9.54c-1.31,2.87-3.19,5.42-5.57,7.59-2.38,2.17-5.22,3.89-8.43,5.08"/>
            </svg>
          </div>
          <p className="text-xs text-cirqa-negro/60 font-light max-w-sm leading-relaxed">
            Wellness visual orientado a la sincronización del ritmo biológico a través de filtros ópticos de precisión.
          </p>
          <div className="text-[11px] text-cirqa-negro/50">
            @cirqa.ar · Buenos Aires, Argentina
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="md:col-span-3 space-y-2 text-xs font-light">
          <span className="text-[10px] uppercase tracking-widest text-cirqa-negro/50 font-medium block mb-3">
            Navegación
          </span>
          <div><a href="#ritmo-circadiano" className="hover:text-cirqa-primario transition-colors">Infografía Ritmo 24h</a></div>
          <div><a href="#pasarela-productos" className="hover:text-cirqa-primario transition-colors">Pasarela de Armazones</a></div>
          <div><a href="#still-life" className="hover:text-cirqa-primario transition-colors">Still Life (Contextos)</a></div>
          <div><a href="#tabla-comparativa" className="hover:text-cirqa-primario transition-colors">Tabla Comparativa</a></div>
          <div><a href="#tecnologia" className="hover:text-cirqa-primario transition-colors">Detalle de Filtros</a></div>
          <div><a href="#nosotros" className="hover:text-cirqa-primario transition-colors">Nosotros (Manifiesto)</a></div>
          <div><a href="#faq" className="hover:text-cirqa-primario transition-colors">Preguntas Frecuentes</a></div>
          <div><a href="#contacto" className="hover:text-cirqa-primario transition-colors">Contacto Directo</a></div>
        </div>

        {/* Col 3: Support & Prescription Access */}
        <div className="md:col-span-2 space-y-2 text-xs font-light">
          <span className="text-[10px] uppercase tracking-widest text-cirqa-negro/50 font-medium block mb-3">
            Soporte & Graduación
          </span>
          <div>
            <button
              onClick={() => onOpenPrescription && onOpenPrescription()}
              className="text-xs text-cirqa-negro/50 hover:text-cirqa-primario transition-colors text-left font-light block"
            >
              Tengo mi Receta
            </button>
          </div>
          <div>
            <button
              onClick={() => onOpenTrials('dia')}
              className="text-xs text-cirqa-negro/50 hover:text-cirqa-primario transition-colors text-left font-light block"
            >
              Ensayos Clínicos
            </button>
          </div>
          <div>
            <a
              href="https://wa.me/5491155891782"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cirqa-negro/50 hover:text-cirqa-primario transition-colors text-left font-light block"
            >
              Atención WhatsApp
            </a>
          </div>
        </div>

        {/* Col 4: Legal & Standards */}
        <div className="md:col-span-3 space-y-2 text-xs font-light">
          <span className="text-[10px] uppercase tracking-widest text-cirqa-negro/50 font-medium block mb-3">
            Homologaciones & Estándares
          </span>
          <p className="text-[11px] text-cirqa-negro/60 leading-relaxed">
            Filtros testeados y homologados bajo normas internacionales ISO 12312-1:2022, ANSI Z80.3:2018 y AS/NZS 1067:2016.
          </p>
          <div className="pt-4 text-[10px] text-cirqa-negro/40">
            © {new Date().getFullYear()} CIRQA. Todos los derechos reservados.
          </div>
        </div>

      </div>
    </footer>
  );
}
