import React from 'react';
import { useLocation } from 'react-router-dom';
import WhatsAppIcon from './WhatsAppIcon';

const OFFICIAL_WHATSAPP = '5491125073598';
const DEFAULT_MESSAGE = 'Hola CIRQA! Quisiera hacerles una consulta.';

export default function WhatsAppFloatingButton() {
  const location = useLocation();

  // No renderizar en el panel de administración ni en login para no obstaculizar la UI
  if (
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/login')
  ) {
    return null;
  }

  const waUrl = `https://wa.me/${OFFICIAL_WHATSAPP}?text=${encodeURIComponent(
    DEFAULT_MESSAGE
  )}`;

  return (
    <aside aria-label="Contacto directo por WhatsApp">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        title="Consultas por WhatsApp"
        className="sm:hidden fixed bottom-5 right-5 z-40 w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-[#20BD5A] to-[#25D366] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(37,211,102,0.38),0_2px_8px_rgba(0,0,0,0.1)] border border-white/25 active:scale-90 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
        style={{
          bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
          right: 'calc(1.25rem + env(safe-area-inset-right, 0px))',
        }}
      >
        {/* Halo sutil de pulsación periódica */}
        <span
          className="absolute -inset-1 rounded-full bg-[#25D366] opacity-25 animate-ping pointer-events-none"
          style={{ animationDuration: '3.5s' }}
        />

        {/* Ícono oficial de WhatsApp */}
        <WhatsAppIcon className="w-7 h-7 fill-current relative z-10" />
      </a>
    </aside>
  );
}
