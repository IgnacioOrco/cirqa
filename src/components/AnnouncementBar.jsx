import React from 'react';
import { motion } from 'framer-motion';

export default function AnnouncementBar() {
  const announcements = [
    '6 CUOTAS SIN INTERÉS',
    '15% OFF CON TRANSFERENCIA',
    'ENVÍO GRATIS A TODO EL PAÍS',
    'ENTREGAS CERTIFICADAS CON SEGUIMIENTO',
  ];

  const marqueeText = announcements.join('   ·   ');

  return (
    <div
      id="announcement-bar"
      className="bg-[#111111] text-white py-2 px-4 border-b border-white/10 text-[11px] sm:text-xs font-montserrat tracking-widest uppercase overflow-hidden select-none relative z-50 shadow-xs"
    >
      <div className="flex items-center justify-center">
        {/* Continuous Smooth Infinite Marquee */}
        <div className="w-full flex overflow-hidden whitespace-nowrap">
          <motion.div
            className="flex items-center gap-6 text-white/90 font-medium"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {[...Array(4)].map((_, i) => (
              <span key={i} className="inline-flex items-center gap-6">
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
