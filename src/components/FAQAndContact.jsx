import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Send, MessageCircle, Mail, MapPin, Clock, CheckCircle2 } from 'lucide-react';

const FAQS = [
  {
    id: 'faq-1',
    question: '¿Tienen protección UV?',
    answer:
      'Sí. Todos los modelos cuentan con protección UV400 (Bloquea radiación UV-A y UV-B) y filtro Antireflejo para un mejor confort.\nEl antirreflejo actúa sobre los reflejos superficiales del lente; el filtro de luz azul actúa sobre la transmisión selectiva de ciertas longitudes de onda.',
  },
  {
    id: 'faq-2',
    question: '¿Las lentes tienen certificación?',
    answer:
      'Sí. Nuestros modelos cuentan con certificación EN/ISO 12312-1 y estándar AS/NZS 1067-2016. Sus porcentajes de bloqueo de luz han sido validados mediante espectrofotometría.',
  },
  {
    id: 'faq-3',
    question: '¿Las gafas son con graduación?',
    answer:
      'Todos los modelos actualmente vienen con lentes neutros sin graduación. Son totalmente compatibles con lentes de contacto. Si necesitas una versión con graduación, contáctanos directamente.',
  },
  {
    id: 'faq-4',
    question: '¿En qué momento del día debería usarlas?',
    answer:
      '• FILTRO AMARILLO: Durante todo el día, especialmente durante períodos prolongados frente a la pantalla.\n• FILTRO NARANJA: Al atardecer o en espacios interiores con luz brillante.\n• FILTRO ROJO: 1–2 horas antes de acostarse.',
  },
  {
    id: 'faq-5',
    question: '¿Hacen envíos?',
    answer:
      'Sí, realizamos envíos a todo el país.',
  },
  {
    id: 'faq-6',
    question: '¿Tienen garantía?',
    answer:
      'Sí. Todos los productos cuentan con garantía de 6 meses por fallas de fabricación. Procesamos los pedidos de lunes a viernes. Una vez confirmado el pago, tu pedido se despacha dentro de las 72 horas hábiles.',
  },
  {
    id: 'faq-7',
    question: '¿Qué incluye la compra?',
    answer:
      'Todas nuestras gafas incluyen: estuche, paño limpiador 100% microfibra, limpia cristales, calcos, llavero y lata reutilizable.',
  },
];

export default function FAQAndContact() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Contact Form State
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitContact = (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.mensaje) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ nombre: '', email: '', mensaje: '' });
      setTimeout(() => setSubmitSuccess(false), 6000);
    }, 800);
  };

  return (
    <div className="bg-white border-t border-cirqa-negro/5 text-cirqa-negro">
      
      {/* ========================================================== */}
      {/* 1. MÓDULO DE PREGUNTAS FRECUENTES (Minimalista Open Line)  */}
      {/* ========================================================== */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6">
        <div className="mb-14 text-center max-w-2xl mx-auto">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-cirqa-primario font-semibold block mb-2">
            Resolución de Dudas
          </span>
          <h2 className="text-3xl sm:text-4xl font-light text-cirqa-negro tracking-tight">
            Preguntas Frecuentes.
          </h2>
          <p className="text-xs sm:text-sm text-cirqa-negro/60 font-light mt-2">
            Todo lo que necesitás saber sobre la tecnología óptica, el uso circadiano y el calibrado de recetas.
          </p>
        </div>

        {/* Minimal Open Accordion List */}
        <div className="bg-cirqa-surface/40 rounded-3xl p-6 sm:p-8 border border-cirqa-negro/10 divide-y divide-cirqa-negro/10 shadow-sm">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={faq.id} className="py-2 transition-colors">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full py-4 text-left flex items-center justify-between gap-4 focus:outline-none group"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-medium text-cirqa-negro group-hover:text-cirqa-primario transition-colors tracking-tight">
                    {faq.question}
                  </span>
                  
                  {/* Fine + icon that rotates 45 deg to an x */}
                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-7 h-7 rounded-full bg-white border border-cirqa-negro/10 flex items-center justify-center flex-shrink-0 text-cirqa-negro/60 group-hover:text-cirqa-primario shadow-sm"
                  >
                    <Plus className="w-4 h-4 stroke-[1.5]" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-5 pt-1 text-xs sm:text-sm text-cirqa-negro/70 font-light leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================== */}
      {/* 2. MÓDULO DE CONTACTO (Línea Única Minimalista)            */}
      {/* ========================================================== */}
      <section id="contacto" className="py-20 border-t border-cirqa-negro/10 bg-cirqa-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Left Col: Contact Information */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-cirqa-primario font-semibold block mb-2">
                  Atención Directa
                </span>
                <h2 className="text-3xl sm:text-4xl font-light text-cirqa-negro tracking-tight">
                  Contactanos.
                </h2>
                <p className="text-xs sm:text-sm text-cirqa-negro/60 font-light mt-2 leading-relaxed">
                  ¿Tenés dudas sobre tu graduación, ensayos clínicos o querés asesoramiento personalizado? Escribinos y te responderemos a la brevedad.
                </p>
              </div>

              {/* Direct channels */}
              <div className="space-y-3 pt-4 text-xs font-light text-cirqa-negro/80">
                <a
                  href="https://wa.me/5491155891782"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-cirqa-negro/5 hover:border-cirqa-negro/20 transition-all shadow-sm group"
                >
                  <div className="w-9 h-9 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] flex-shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-cirqa-negro block group-hover:text-cirqa-primario transition-colors">
                      WhatsApp Oficial
                    </span>
                    <span className="text-[11px] text-cirqa-negro/50">+54 9 11 5589-1782</span>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-cirqa-negro/5 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-cirqa-negro/5 flex items-center justify-center text-cirqa-negro flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-cirqa-negro block">Email de Consultas</span>
                    <span className="text-[11px] text-cirqa-negro/70">info@cirqa.com.ar</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-cirqa-negro/5 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-cirqa-negro/5 flex items-center justify-center text-cirqa-negro flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-cirqa-negro block">Horario de Atención</span>
                    <span className="text-[11px] text-cirqa-negro/70">Lunes a Viernes · 09:00 a 18:00 hs</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-cirqa-negro/5 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-cirqa-negro/5 flex items-center justify-center text-cirqa-negro flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-cirqa-negro block">Ubicación</span>
                    <span className="text-[11px] text-cirqa-negro/70">Buenos Aires, Argentina</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: High-End Form */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-cirqa-negro/10 flex flex-col justify-between shadow-xl">
              
              <form onSubmit={handleSubmitContact} className="space-y-6">
                <div>
                  <label htmlFor="nombre" className="text-[11px] font-bold uppercase tracking-wider text-cirqa-negro/80 block mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Tu nombre y apellido"
                    className="w-full text-sm py-2.5 bg-transparent border-b border-cirqa-negro/30 focus:border-cirqa-primario focus:outline-none text-cirqa-negro font-normal placeholder:text-cirqa-negro/40 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-cirqa-negro/80 block mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="ejemplo@correo.com"
                    className="w-full text-sm py-2.5 bg-transparent border-b border-cirqa-negro/30 focus:border-cirqa-primario focus:outline-none text-cirqa-negro font-normal placeholder:text-cirqa-negro/40 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="mensaje" className="text-[11px] font-bold uppercase tracking-wider text-cirqa-negro/80 block mb-1">
                    Mensaje
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    required
                    rows={3}
                    value={formData.mensaje}
                    onChange={handleInputChange}
                    placeholder="Escribí acá tu consulta..."
                    className="w-full text-sm py-2.5 bg-transparent border-b border-cirqa-negro/30 focus:border-cirqa-primario focus:outline-none text-cirqa-negro font-normal placeholder:text-cirqa-negro/40 leading-relaxed resize-none transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-cirqa-primario text-white text-xs font-bold tracking-widest uppercase py-4 rounded-full hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Enviando...' : 'Enviar'}</span>
                  </button>
                </div>
              </form>

              {/* Feedback Success Notification */}
              {submitSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="mt-4 p-4 bg-cirqa-negro text-white rounded-2xl text-xs flex items-center gap-2.5 font-light shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-cirqa-arena flex-shrink-0" />
                  <span>¡Mensaje enviado con éxito! Nuestro equipo te contactará a la brevedad.</span>
                </motion.div>
              )}

            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
