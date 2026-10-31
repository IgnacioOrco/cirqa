import React from 'react';
import { isCyberMondayActive } from '../utils/cyberMonday';

export default function AnnouncementBar() {
  const isCyber = isCyberMondayActive();

  return (
    <div
      id="announcement-bar"
      className="bg-[#111111] text-white py-2 px-4 border-b border-white/10 text-[11px] sm:text-xs font-montserrat tracking-widest uppercase overflow-hidden select-none relative z-50 shadow-xs"
    >
      <div className="flex items-center justify-center">
        {/* Continuous Smooth Infinite Marquee - 100% CSS en hilo compositor sin JS */}
        <div className="w-full flex overflow-hidden whitespace-nowrap">
          <div className="animate-marquee items-center gap-6 text-white/90 font-medium">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="inline-flex items-center gap-6">
                {isCyber && (
                  <>
                    <span className="text-amber-400 font-bold">
                      🔥 CYBER MONDAY: <strong className="text-white font-extrabold underline decoration-cirqa-primario">20% OFF GLOBAL</strong> EN TODA LA TIENDA
                    </span>
                    <span className="text-white/40">·</span>
                  </>
                )}
                <span>
                  <strong className="text-amber-400 font-semibold">6 CUOTAS SIN INTERÉS</strong>
                </span>
                <span className="text-white/40">·</span>
                <span>
                  <strong className="text-emerald-400 font-semibold">15% OFF</strong> CON TRANSFERENCIA
                </span>
                <span className="text-white/40">·</span>
                <span>
                  <strong className="text-emerald-400 font-semibold">ENVÍO GRATIS</strong> A TODO EL PAÍS
                </span>
                <span className="text-white/40">·</span>
                <span className="text-white/80">
                  ENTREGAS CERTIFICADAS <strong className="text-white font-semibold">CON SEGUIMIENTO</strong>
                </span>
                <span className="text-white/40">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
