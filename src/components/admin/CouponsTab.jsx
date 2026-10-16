import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Plus,
  Search,
  RefreshCw,
  Percent,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit3,
  Trash2,
  Sparkles,
  History,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  Shuffle,
  DollarSign,
  Layers,
  X,
  Check,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { couponService, handleSessionExpired } from '../../services/api';

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Porcentaje (%)', desc: 'Descuento porcentual sobre el total de productos' },
  { value: 'fixed', label: 'Monto Fijo ($ ARS)', desc: 'Descuento en pesos directo al subtotal' },
  { value: 'bogo_2x1', label: '2x1 (Llevá 2, pagá 1)', desc: 'Por cada 2 unidades, la 2da es 100% gratis' },
  { value: 'bogo_3x2', label: '3x2 (Llevá 3, pagá 2)', desc: 'Por cada 3 unidades, la 3ra es 100% gratis' },
  { value: 'second_unit_percent', label: 'Descuento en la 2da Unidad', desc: 'Aplica % de descuento a la segunda unidad' },
];

export default function CouponsTab({ showToast }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | active | paused | expired

  // Modal de Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Modal de Historial de Usos
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyCoupon, setHistoryCoupon] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minPurchaseAmount: 0,
    minQuantity: 1,
    maxUses: '',
    maxUsesPerCustomer: '',
    combinableWithTransfer: true,
    startsAt: '',
    expiresAt: '',
    isActive: true,
  });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await couponService.getAll();
      setCoupons(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleSessionExpired(true);
        return;
      }
      setError(err.message || 'No fue posible cargar los cupones.');
      if (showToast) showToast('Error al cargar cupones.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const generateRandomCode = () => {
    const prefixes = ['CIRQA', 'PROMO', 'VIP', 'SALE', 'SPECIAL'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const n = Math.floor(10 + Math.random() * 90);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randLetters = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setFormData((prev) => ({ ...prev, code: `${p}${n}${randLetters}` }));
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 15,
      minPurchaseAmount: 0,
      minQuantity: 1,
      maxUses: '',
      maxUsesPerCustomer: '1',
      combinableWithTransfer: true,
      startsAt: new Date().toISOString().slice(0, 10),
      expiresAt: '',
      isActive: true,
    });
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || 0,
      minPurchaseAmount: coupon.minPurchaseAmount || 0,
      minQuantity: coupon.minQuantity || 1,
      maxUses: coupon.maxUses !== null && coupon.maxUses !== undefined ? String(coupon.maxUses) : '',
      maxUsesPerCustomer: coupon.maxUsesPerCustomer !== null && coupon.maxUsesPerCustomer !== undefined ? String(coupon.maxUsesPerCustomer) : '',
      combinableWithTransfer: coupon.combinableWithTransfer !== false,
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 10) : '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '',
      isActive: coupon.isActive !== false,
    });
    setModalError(null);
    setModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setModalError('El código de cupón es obligatorio.');
      return;
    }

    setSaving(true);
    setModalError(null);

    const payload = {
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue) || 0,
      minPurchaseAmount: Number(formData.minPurchaseAmount) || 0,
      minQuantity: Number(formData.minQuantity) || 1,
      maxUses: formData.maxUses === '' ? null : Number(formData.maxUses),
      maxUsesPerCustomer: formData.maxUsesPerCustomer === '' ? null : Number(formData.maxUsesPerCustomer),
      combinableWithTransfer: Boolean(formData.combinableWithTransfer),
      startsAt: formData.startsAt ? new Date(formData.startsAt) : new Date(),
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
      isActive: Boolean(formData.isActive),
    };

    try {
      if (editingCoupon) {
        await couponService.update(editingCoupon._id, payload);
        if (showToast) showToast(`Cupón ${payload.code} actualizado exitosamente.`);
      } else {
        await couponService.create(payload);
        if (showToast) showToast(`Cupón ${payload.code} creado exitosamente.`);
      }
      setModalOpen(false);
      fetchCoupons();
    } catch (err) {
      setModalError(err.message || 'Error al guardar el cupón.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await couponService.update(coupon._id, { isActive: !coupon.isActive });
      setCoupons((prev) =>
        prev.map((c) => (c._id === coupon._id ? { ...c, isActive: !c.isActive } : c))
      );
      if (showToast) {
        showToast(
          `Cupón ${coupon.code} ${!coupon.isActive ? 'activado' : 'pausado'}.`
        );
      }
    } catch (err) {
      if (showToast) showToast('Error al actualizar estado del cupón.', 'error');
    }
  };

  const handleResetUses = async (coupon) => {
    const ok = window.confirm(`¿Deseas reiniciar a 0 el contador de usos del cupón ${coupon.code}?`);
    if (!ok) return;

    try {
      await couponService.update(coupon._id, { resetUsedCount: true });
      setCoupons((prev) =>
        prev.map((c) => (c._id === coupon._id ? { ...c, usedCount: 0 } : c))
      );
      if (showToast) showToast(`Contador de usos de ${coupon.code} reiniciado a 0.`);
    } catch (err) {
      if (showToast) showToast('Error al reiniciar usos.', 'error');
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    const ok = window.confirm(`¿Estás seguro de eliminar permanentemente el cupón ${coupon.code}?`);
    if (!ok) return;

    try {
      await couponService.delete(coupon._id);
      setCoupons((prev) => prev.filter((c) => c._id !== coupon._id));
      if (showToast) showToast(`Cupón ${coupon.code} eliminado.`);
    } catch (err) {
      if (showToast) showToast('Error al eliminar cupón.', 'error');
    }
  };

  // Filtrado reactivo de cupones
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.code?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q);

      const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();

      let matchesStatus = true;
      if (filterStatus === 'active') matchesStatus = c.isActive && !isExpired;
      else if (filterStatus === 'paused') matchesStatus = !c.isActive;
      else if (filterStatus === 'expired') matchesStatus = isExpired;

      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchQuery, filterStatus]);

  // Formato de etiqueta de beneficio
  const getBenefitLabel = (coupon) => {
    switch (coupon.discountType) {
      case 'percentage':
        return `${coupon.discountValue}% OFF`;
      case 'fixed':
        return `$${Number(coupon.discountValue).toLocaleString('es-AR')} OFF`;
      case 'bogo_2x1':
        return '2x1 (2do GRATIS)';
      case 'bogo_3x2':
        return '3x2 (3ro GRATIS)';
      case 'second_unit_percent':
        return `${coupon.discountValue}% OFF 2da unidad`;
      default:
        return `${coupon.discountValue || 0}%`;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header con Métricas y Botón Crear */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-cirqa-negro/5 shadow-xs">
          <div className="flex items-center justify-between text-cirqa-negro/40 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cupones Registrados</span>
            <Tag className="w-4 h-4 text-cirqa-arena" />
          </div>
          <div className="text-2xl font-light text-cirqa-negro">{coupons.length}</div>
          <p className="text-[10px] text-cirqa-negro/50 mt-1">Configurados en catálogo</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-cirqa-negro/5 shadow-xs">
          <div className="flex items-center justify-between text-cirqa-negro/40 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cupones Activos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-light text-emerald-700">
            {coupons.filter((c) => c.isActive && (!c.expiresAt || new Date(c.expiresAt) >= new Date())).length}
          </div>
          <p className="text-[10px] text-cirqa-negro/50 mt-1">Disponibles para compras</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-cirqa-negro/5 shadow-xs">
          <div className="flex items-center justify-between text-cirqa-negro/40 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Usos Totales</span>
            <Sparkles className="w-4 h-4 text-cirqa-primario" />
          </div>
          <div className="text-2xl font-light text-cirqa-negro">
            {coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0)}
          </div>
          <p className="text-[10px] text-cirqa-negro/50 mt-1">Órdenes canjeadas</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-cirqa-negro/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-cirqa-negro/40 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Acción Rápida</span>
            <Percent className="w-4 h-4 text-cirqa-primario" />
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full py-2.5 px-4 bg-cirqa-negro hover:bg-black text-white text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Cupón</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-cirqa-negro/5 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-cirqa-negro/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código o descripción..."
            className="w-full pl-11 pr-4 py-2.5 text-xs bg-[#FBFBFA] border border-cirqa-negro/10 rounded-2xl focus:outline-none focus:border-cirqa-negro transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'active', label: 'Activos' },
            { id: 'paused', label: 'Pausados' },
            { id: 'expired', label: 'Expirados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-cirqa-negro text-white shadow-xs'
                  : 'bg-black/5 text-cirqa-negro/70 hover:bg-black/10'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="p-2 rounded-2xl bg-black/5 hover:bg-black/10 text-cirqa-negro transition-colors cursor-pointer"
            title="Refrescar cupones"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Tabla de Cupones */}
      <div className="bg-white rounded-3xl border border-cirqa-negro/5 shadow-sm overflow-hidden">
        {loading && coupons.length === 0 ? (
          <div className="py-16 text-center text-xs text-cirqa-negro/50 flex flex-col items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-cirqa-primario" />
            <span>Cargando códigos de descuento...</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="py-16 text-center text-xs text-cirqa-negro/50 space-y-2">
            <Tag className="w-8 h-8 text-cirqa-negro/20 mx-auto" />
            <p className="font-medium text-cirqa-negro/70">No se encontraron cupones</p>
            <p className="text-[11px] text-cirqa-negro/40">
              {searchQuery ? 'Probá con otro término de búsqueda.' : 'Creá tu primer cupón para promocionar la tienda.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBFBFA] border-b border-cirqa-negro/5 text-cirqa-negro/60 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código / Descripción</th>
                  <th className="py-3 px-4">Beneficio</th>
                  <th className="py-3 px-4">Condiciones</th>
                  <th className="py-3 px-4 text-center">Usos / Límite</th>
                  <th className="py-3 px-4 text-center">Acumulable</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cirqa-negro/5">
                {filteredCoupons.map((coupon) => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                  const isMaxedOut = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;

                  return (
                    <tr key={coupon._id} className="hover:bg-black/[0.015] transition-colors">
                      {/* Código */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-black/5 px-2 py-1 rounded-md text-cirqa-negro border border-black/5">
                            {coupon.code}
                          </span>
                        </div>
                        {coupon.description && (
                          <p className="text-[11px] text-cirqa-negro/50 font-light mt-0.5 line-clamp-1">
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Beneficio */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          {getBenefitLabel(coupon)}
                        </span>
                      </td>

                      {/* Condiciones */}
                      <td className="py-3 px-4 text-[11px] text-cirqa-negro/70 space-y-0.5">
                        {coupon.minPurchaseAmount > 0 && (
                          <div>Mínimo: ${Number(coupon.minPurchaseAmount).toLocaleString('es-AR')}</div>
                        )}
                        {coupon.minQuantity > 1 && <div>Mín. unidades: {coupon.minQuantity}</div>}
                        {coupon.expiresAt && (
                          <div className={`flex items-center gap-1 ${isExpired ? 'text-red-600 font-medium' : 'text-cirqa-negro/50'}`}>
                            <Calendar className="w-3 h-3" />
                            <span>Vence: {new Date(coupon.expiresAt).toLocaleDateString('es-AR')}</span>
                          </div>
                        )}
                        {!coupon.minPurchaseAmount && coupon.minQuantity <= 1 && !coupon.expiresAt && (
                          <span className="text-cirqa-negro/40 italic">Sin restricciones</span>
                        )}
                      </td>

                      {/* Usos */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-mono text-xs font-semibold text-cirqa-negro">
                          {coupon.usedCount || 0}
                          <span className="text-cirqa-negro/40 font-normal">
                            {' '}/ {coupon.maxUses !== null ? coupon.maxUses : '∞'}
                          </span>
                        </div>
                        {coupon.usageHistory?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryCoupon(coupon);
                              setHistoryModalOpen(true);
                            }}
                            className="text-[10px] text-cirqa-primario hover:underline inline-flex items-center gap-0.5 mt-0.5 cursor-pointer font-medium"
                          >
                            <History className="w-2.5 h-2.5" />
                            <span>Ver historial ({coupon.usageHistory.length})</span>
                          </button>
                        )}
                      </td>

                      {/* Acumulable */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            coupon.combinableWithTransfer !== false
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {coupon.combinableWithTransfer !== false ? '+15% Transf.' : 'No acum.'}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3 text-red-500" />
                            Vencido
                          </span>
                        ) : isMaxedOut ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            Agotado
                          </span>
                        ) : coupon.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                            Pausado
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(coupon)}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                              coupon.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                            }`}
                            title={coupon.isActive ? 'Pausar cupón' : 'Activar cupón'}
                          >
                            {coupon.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResetUses(coupon)}
                            className="p-1.5 rounded-xl border border-cirqa-negro/10 hover:bg-black/5 text-cirqa-negro transition-colors cursor-pointer"
                            title="Reiniciar contador de usos a 0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(coupon)}
                            className="p-1.5 rounded-xl border border-cirqa-negro/10 hover:bg-black/5 text-cirqa-primario transition-colors cursor-pointer"
                            title="Editar cupón"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon)}
                            className="p-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                            title="Eliminar cupón"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL CREAR / EDITAR CUPÓN */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-cirqa-negro/10 overflow-hidden my-8"
            >
              <div className="p-6 border-b border-cirqa-negro/5 flex items-center justify-between bg-[#FBFBFA]">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cirqa-primario" />
                  <h3 className="font-semibold text-sm text-cirqa-negro">
                    {editingCoupon ? `Editar Cupón: ${editingCoupon.code}` : 'Crear Nuevo Código de Descuento'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-xl text-cirqa-negro/40 hover:text-cirqa-negro hover:bg-black/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCoupon} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {modalError && (
                  <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Código */}
                <div>
                  <label className="text-[11px] font-semibold text-cirqa-negro/70 block mb-1">
                    Código de Cupón *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="Ej: CIRQA10, 2X1CIRQA, VIP2026"
                      className="flex-grow px-3.5 py-2.5 text-xs font-mono uppercase bg-[#FBFBFA] border border-cirqa-negro/15 rounded-2xl focus:outline-none focus:border-cirqa-negro"
                    />
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="px-3.5 py-2.5 bg-black/5 hover:bg-black/10 text-cirqa-negro text-xs rounded-2xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Generar código aleatorio"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Aleatorio</span>
                    </button>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-[11px] font-semibold text-cirqa-negro/70 block mb-1">
                    Descripción / Mensaje para el Cliente
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ej: 15% OFF en toda la tienda para nuevos clientes"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FBFBFA] border border-cirqa-negro/15 rounded-2xl focus:outline-none focus:border-cirqa-negro"
                  />
                </div>

                {/* Tipo de Promoción y Valor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-cirqa-negro/70 block mb-1">
                      Tipo de Promoción *
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FBFBFA] border border-cirqa-negro/15 rounded-2xl focus:outline-none focus:border-cirqa-negro cursor-pointer"
                    >
                      {DISCOUNT_TYPES.map((dt) => (
                        <option key={dt.value} value={dt.value}>
                          {dt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-cirqa-negro/70 block mb-1">
                      {formData.discountType === 'percentage'
                        ? 'Porcentaje de Descuento (%)'
                        : formData.discountType === 'fixed'
                        ? 'Monto Fijo ($ ARS)'
                        : formData.discountType === 'second_unit_percent'
                        ? '% en la 2da Unidad'
                        : 'Valor (Automático)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={formData.discountType === 'bogo_2x1' || formData.discountType === 'bogo_3x2'}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      placeholder={formData.discountType === 'fixed' ? '15000' : '15'}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FBFBFA] border border-cirqa-negro/15 rounded-2xl focus:outline-none focus:border-cirqa-negro disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Límites de uso */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-cirqa-negro/70 block mb-1">
                      Límite Total de Usos (Opcional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                      placeholder="Vacío = Ilimitado"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FBFBFA] border border-cirqa-negro/15 rounded-2xl focus:outline-none focus:border-cirqa-negro"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-cirqa-negro/70 block mb-1">
                      Límite por Cliente (Opcional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxUsesPerCustomer}
                      onChange={(e) => setFormData({ ...formData, maxUsesPerCustomer: e.target.value })}
                      placeholder="Ej: 1 por cliente"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FBFBFA] border border-cirqa-negro/15 rounded-2xl focus:outline-none focus:border-cirqa-negro"
                    />
                  </div>
                </div>

                {/* Compra mínima y cantidad mínima */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-cirqa-negro/70 block mb-1">
                      Compra Mínima ($ ARS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minPurchaseAmount}
                      onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                      placeholder="0 = Sin mínimo"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FBFBFA] border border-cirqa-negro/15 rounded-2xl focus:outline-none focus:border-cirqa-negro"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-cirqa-negro/70 block mb-1">
                      Cantidad Mínima de Unidades
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                      placeholder="1"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FBFBFA] border border-cirqa-negro/15 rounded-2xl focus:outline-none focus:border-cirqa-negro"
                    />
                  </div>
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-cirqa-negro/70 block mb-1">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={formData.startsAt}
                      onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FBFBFA] border border-cirqa-negro/15 rounded-2xl focus:outline-none focus:border-cirqa-negro"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-cirqa-negro/70 block mb-1">
                      Fecha de Vencimiento (Opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FBFBFA] border border-cirqa-negro/15 rounded-2xl focus:outline-none focus:border-cirqa-negro"
                    />
                  </div>
                </div>

                {/* Switches */}
                <div className="pt-2 border-t border-cirqa-negro/5 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/5 hover:border-cirqa-negro/15 transition-colors">
                    <div>
                      <span className="text-xs font-semibold text-cirqa-negro block">
                        Acumulable con 15% OFF Transferencia
                      </span>
                      <span className="text-[10px] text-cirqa-negro/50 block font-light">
                        Permite que el cliente combine este cupón con el 15% de descuento por transferencia bancaria.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.combinableWithTransfer}
                      onChange={(e) => setFormData({ ...formData, combinableWithTransfer: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/5 hover:border-cirqa-negro/15 transition-colors">
                    <div>
                      <span className="text-xs font-semibold text-cirqa-negro block">
                        Cupón Activo
                      </span>
                      <span className="text-[10px] text-cirqa-negro/50 block font-light">
                        Si se desmarca, ningún cliente podrá canjearlo en el checkout.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 accent-cirqa-negro rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Footer Modal */}
                <div className="pt-4 border-t border-cirqa-negro/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl border border-cirqa-negro/15 text-xs font-medium text-cirqa-negro hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-2xl bg-cirqa-negro hover:bg-black text-white text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{editingCoupon ? 'Guardar Cambios' : 'Crear Cupón'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MODAL HISTORIAL DE USOS */}
      <AnimatePresence>
        {historyModalOpen && historyCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-cirqa-negro/10 overflow-hidden"
            >
              <div className="p-6 border-b border-cirqa-negro/5 flex items-center justify-between bg-[#FBFBFA]">
                <div>
                  <h3 className="font-semibold text-sm text-cirqa-negro flex items-center gap-2">
                    <History className="w-4 h-4 text-cirqa-primario" />
                    Historial de Usos: <span className="font-mono text-emerald-700">{historyCoupon.code}</span>
                  </h3>
                  <p className="text-[11px] text-cirqa-negro/50 mt-0.5">
                    {historyCoupon.usageHistory?.length || 0} canjes registrados
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
                  className="p-1.5 rounded-xl text-cirqa-negro/40 hover:text-cirqa-negro hover:bg-black/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {(!historyCoupon.usageHistory || historyCoupon.usageHistory.length === 0) ? (
                  <p className="text-center text-xs text-cirqa-negro/40 py-8">
                    Este cupón todavía no ha sido utilizado en ninguna orden.
                  </p>
                ) : (
                  <div className="divide-y divide-cirqa-negro/5">
                    {historyCoupon.usageHistory.map((h, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-mono font-bold text-cirqa-negro">
                            {h.orderNumber || 'Orden sin código'}
                          </div>
                          <div className="text-[11px] text-cirqa-negro/50">{h.customerEmail || 'Sin email'}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-semibold text-emerald-700">
                            -${Number(h.discountApplied || 0).toLocaleString('es-AR')}
                          </div>
                          <div className="text-[10px] text-cirqa-negro/40">
                            {h.usedAt ? new Date(h.usedAt).toLocaleString('es-AR') : 'Fecha desconocida'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-cirqa-negro/5 bg-[#FBFBFA] flex justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
                  className="px-4 py-2 bg-cirqa-negro text-white rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
