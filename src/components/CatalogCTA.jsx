import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Glasses, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CatalogCTA() {
  return (
    <section className="py-20 bg-gradient-to-b from-[#FBFBFA] to-white border-b border-cirqa-negro/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-cirqa-negro text-white rounded-3xl p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-2xl">
          
          {/* Resplandor ambiental de fondo */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-cirqa-primario/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono text-cirqa-arena">
              <Sparkles className="w-3.5 h-3.5" />
              <span>COLECCIÓN COMPLETA 2026</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white leading-tight">
              Explorá todos los armazones en nuestro Catálogo Oficial
            </h2>

            <p className="text-sm text-white/70 font-light leading-relaxed max-w-xl">
              Cada modelo está diseñado bajo principios de ergonomía craneal y aleaciones aeroespaciales. Configurá cada armazón con la tecnología circadiana específica para tu ritmo biológico.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to="/catalogo"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-cirqa-negro hover:bg-cirqa-arena rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md group cursor-pointer"
              >
                <span>Ver Catálogo Completo</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
