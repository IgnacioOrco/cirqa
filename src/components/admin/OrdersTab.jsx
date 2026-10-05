import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  DollarSign,
  TrendingUp,
  X,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { orderService, formatMediaUrl } from '../../services/api';

const SHIPPING_STATUSES = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'PREPARACION', label: 'En Preparación' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'ENTREGADO', label: 'Entregado' },
];

export default function OrdersTab({ showToast, onOrdersCountChange }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros y Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // ALL | PAID | PENDING | CANCELLED
  const [shippingFilter, setShippingFilter] = useState('ALL'); // ALL | PENDIENTE | PREPARACION | ENVIADO | ENTREGADO

  // Modal Detalle
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingForm, setShippingForm] = useState({
    carrier: '',
    trackingNumber: '',
    status: 'PENDIENTE',
  });
  const [savingShipping, setSavingShipping] = useState(false);

  // Carga de órdenes desde API
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrders();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);
      if (onOrdersCountChange) {
        onOrdersCountChange(list.length);
      }
    } catch (err) {
      console.error('[OrdersTab] Error cargando órdenes:', err);
      setError('No fue posible cargar las órdenes de compra desde la base de datos.');
    } finally {
      setLoading(false);
    }
  }, [onOrdersCountChange]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filtrado de órdenes
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const orderNum = (order.orderNumber || order._id || '').toLowerCase();
      const custName = (order.customer?.name || '').toLowerCase();
      const custEmail = (order.customer?.email || '').toLowerCase();
      const custDni = (order.customer?.dni || '').toLowerCase();

      const matchesSearch =
        !q ||
        orderNum.includes(q) ||
        custName.includes(q) ||
        custEmail.includes(q) ||
        custDni.includes(q);

      // Pago
      const pStatus = (order.status || '').toUpperCase();
      const matchesPayment =
        paymentFilter === 'ALL' ||
        (paymentFilter === 'PAID' && (pStatus === 'PAID' || pStatus === 'APROBADO' || pStatus === 'APPROVED')) ||
        (paymentFilter === 'PENDING' && (pStatus === 'PENDING' || pStatus === 'PENDIENTE')) ||
        (paymentFilter === 'CANCELLED' && (pStatus === 'CANCELLED' || pStatus === 'REJECTED' || pStatus === 'FALLIDO'));

      // Envío
      const currentShippingStatus = (
        order.shipping?.status ||
        order.shippingStatus ||
        'PENDIENTE'
      ).toUpperCase();

      const matchesShipping =
        shippingFilter === 'ALL' ||
        (shippingFilter === 'PENDIENTE' && (currentShippingStatus === 'PENDIENTE' || !currentShippingStatus)) ||
        (shippingFilter === 'PREPARACION' && (currentShippingStatus === 'PREPARACION' || currentShippingStatus === 'PREPARACIÓN')) ||
        (shippingFilter === 'ENVIADO' && currentShippingStatus === 'ENVIADO') ||
        (shippingFilter === 'ENTREGADO' && currentShippingStatus === 'ENTREGADO');

      return matchesSearch && matchesPayment && matchesShipping;
    });
  }, [orders, searchQuery, paymentFilter, shippingFilter]);

  // Métricas
  const stats = useMemo(() => {
    const totalCount = orders.length;
    const paidCount = orders.filter((o) => {
      const s = (o.status || '').toUpperCase();
      return s === 'PAID' || s === 'APROBADO' || s === 'APPROVED';
    }).length;

    const totalRevenue = orders
      .filter((o) => {
        const s = (o.status || '').toUpperCase();
        return s === 'PAID' || s === 'APROBADO' || s === 'APPROVED';
      })
      .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);

    const pendingShippingCount = orders.filter((o) => {
      const s = (o.shipping?.status || o.shippingStatus || 'PENDIENTE').toUpperCase();
      return s === 'PENDIENTE' || s === 'PREPARACION';
    }).length;

    return { totalCount, paidCount, totalRevenue, pendingShippingCount };
  }, [orders]);

  // Formato de fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Abrir Modal de Detalle
  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setShippingForm({
      carrier: order.shipping?.carrier || order.carrier || '',
      trackingNumber: order.shipping?.trackingNumber || order.trackingNumber || '',
      status: order.shipping?.status || order.shippingStatus || 'PENDIENTE',
    });
  };

  // Guardar Cambios de Envío
  const handleSaveShipping = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOrder) return;

    setSavingShipping(true);
    try {
      await orderService.updateOrderShipping(selectedOrder._id, shippingForm);

      if (showToast) {
        showToast('Logística y estado de envío actualizados correctamente', 'success');
      }

      // Actualizar localmente
      setOrders((prev) =>
        prev.map((o) =>
          o._id === selectedOrder._id
            ? {
                ...o,
                shipping: {
                  ...(o.shipping || {}),
                  ...shippingForm,
                },
                shippingStatus: shippingForm.status,
              }
            : o
        )
      );

      setSelectedOrder((prev) => ({
        ...prev,
        shipping: {
          ...(prev?.shipping || {}),
          ...shippingForm,
        },
        shippingStatus: shippingForm.status,
      }));
    } catch (err) {
      console.error('[OrdersTab] Error actualizando envío:', err);
      if (showToast) {
        showToast(err.message || 'Error al actualizar el estado de envío', 'error');
      }
    } finally {
      setSavingShipping(false);
    }
  };

  // Badges
  const renderPaymentBadge = (status) => {
    const norm = (status || '').toUpperCase();
    if (norm === 'PAID' || norm === 'APROBADO' || norm === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Pagado
        </span>
      );
    }
    if (norm === 'PENDING' || norm === 'PENDIENTE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pendiente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-50 text-cirqa-carmin border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-cirqa-carmin" />
        Fallido
      </span>
    );
  };

  const renderShippingBadge = (status) => {
    const norm = (status || 'PENDIENTE').toUpperCase();
    if (norm === 'ENTREGADO') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Entregado
        </span>
      );
    }
    if (norm === 'ENVIADO') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Truck className="w-3 h-3 text-indigo-600" />
          Enviado
        </span>
      );
    }
    if (norm === 'PREPARACION' || norm === 'PREPARACIÓN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Package className="w-3 h-3 text-amber-600" />
          Preparación
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
        <Clock className="w-3 h-3 text-gray-500" />
        Pendiente
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-cirqa-negro/10 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cirqa-surface border border-cirqa-negro/5 flex items-center justify-center text-cirqa-negro">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-cirqa-negro/50 block">
              Total Pedidos
            </span>
            <span className="text-xl sm:text-2xl font-light text-cirqa-negro font-mono font-bold">
              {stats.totalCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-cirqa-negro/10 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">
              Pagados
            </span>
            <span className="text-xl sm:text-2xl font-light text-cirqa-negro font-mono font-bold">
              {stats.paidCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-cirqa-negro/10 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">
              Por Enviar
            </span>
            <span className="text-xl sm:text-2xl font-light text-cirqa-negro font-mono font-bold">
              {stats.pendingShippingCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-cirqa-negro/10 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cirqa-primario/10 text-cirqa-primario border border-cirqa-primario/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-cirqa-primario block">
              Facturación
            </span>
            <span className="text-lg sm:text-xl font-light text-cirqa-negro font-mono font-bold truncate block">
              ${stats.totalRevenue.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-cirqa-negro/10 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Buscador */}
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 text-cirqa-negro/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por N° Orden, cliente, email o DNI..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-cirqa-negro/15 text-xs text-cirqa-negro focus:outline-none focus:border-cirqa-negro transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtro de Pago */}
            <div className="flex items-center gap-1 bg-cirqa-surface p-1 rounded-2xl border border-cirqa-negro/5 text-xs">
              <span className="text-[10px] font-semibold text-cirqa-negro/50 uppercase px-2">
                Pago:
              </span>
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'PAID', label: 'Pagado' },
                { id: 'PENDING', label: 'Pendiente' },
                { id: 'CANCELLED', label: 'Fallido' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPaymentFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                    paymentFilter === tab.id
                      ? 'bg-cirqa-negro text-white shadow-xs font-semibold'
                      : 'text-cirqa-negro/70 hover:text-cirqa-negro'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filtro de Envío */}
            <div className="flex items-center gap-1 bg-cirqa-surface p-1 rounded-2xl border border-cirqa-negro/5 text-xs">
              <span className="text-[10px] font-semibold text-cirqa-negro/50 uppercase px-2">
                Envío:
              </span>
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'PENDIENTE', label: 'Pendiente' },
                { id: 'PREPARACION', label: 'Preparación' },
                { id: 'ENVIADO', label: 'Enviado' },
                { id: 'ENTREGADO', label: 'Entregado' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setShippingFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                    shippingFilter === tab.id
                      ? 'bg-cirqa-negro text-white shadow-xs font-semibold'
                      : 'text-cirqa-negro/70 hover:text-cirqa-negro'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Botón Refrescar */}
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="p-2.5 rounded-2xl border border-cirqa-negro/10 hover:border-cirqa-negro/30 text-cirqa-negro/70 hover:text-cirqa-negro transition-colors disabled:opacity-40"
              title="Recargar órdenes"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cirqa-primario' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Grilla / Tabla de Órdenes */}
      <div className="bg-white rounded-3xl border border-cirqa-negro/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cirqa-negro/10 bg-cirqa-surface text-[11px] font-bold text-cirqa-negro/60 uppercase tracking-wider">
                <th className="py-4 px-6">N° de Orden</th>
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-6">Cliente</th>
                <th className="py-4 px-6">Monto Total</th>
                <th className="py-4 px-6">Estado de Pago</th>
                <th className="py-4 px-6">Estado de Entrega</th>
                <th className="py-4 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cirqa-negro/5 text-xs text-cirqa-negro">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-cirqa-negro/50">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cirqa-primario mb-2" />
                    <span>Cargando órdenes registradas...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-cirqa-negro/50">
                    <ClipboardList className="w-8 h-8 mx-auto text-cirqa-negro/20 mb-2" />
                    <p className="font-medium text-cirqa-negro">No se encontraron órdenes</p>
                    <p className="text-[11px] text-cirqa-negro/40 mt-0.5">
                      Intenta ajustar los filtros o el término de búsqueda.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const displayOrderNumber =
                    order.orderNumber ||
                    `CQ-${order._id ? order._id.slice(-6).toUpperCase() : 'PEND'}`;

                  const shippingStatus =
                    order.shipping?.status || order.shippingStatus || 'PENDIENTE';

                  return (
                    <tr
                      key={order._id}
                      onClick={() => handleOpenDetail(order)}
                      className="hover:bg-cirqa-surface/80 transition-colors cursor-pointer group"
                    >
                      {/* N° Orden */}
                      <td className="py-4 px-6 font-mono font-bold text-cirqa-negro">
                        <span className="group-hover:text-cirqa-primario transition-colors">
                          {displayOrderNumber}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="py-4 px-6 text-cirqa-negro/70 font-light">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Cliente */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-cirqa-negro">
                          {order.customer?.name || 'Cliente sin nombre'}
                        </div>
                        <div className="text-[11px] text-cirqa-negro/50 font-light">
                          {order.customer?.email || '-'}
                        </div>
                      </td>

                      {/* Monto Total */}
                      <td className="py-4 px-6 font-semibold text-cirqa-negro">
                        ${(Number(order.totalAmount) || 0).toLocaleString('es-AR')} ARS
                      </td>

                      {/* Estado de Pago */}
                      <td className="py-4 px-6">
                        {renderPaymentBadge(order.status)}
                      </td>

                      {/* Estado de Entrega */}
                      <td className="py-4 px-6">
                        {renderShippingBadge(shippingStatus)}
                      </td>

                      {/* Acción */}
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(order);
                          }}
                          className="p-2 rounded-xl text-cirqa-negro/50 hover:text-cirqa-negro hover:bg-black/5 transition-all inline-flex items-center gap-1 text-[11px] font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal de Detalle de Pedido */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl border border-cirqa-negro/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col font-montserrat text-cirqa-negro"
            >
              {/* Header Modal */}
              <div className="px-6 sm:px-8 py-5 border-b border-cirqa-negro/10 flex items-center justify-between bg-cirqa-surface flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cirqa-negro text-white flex items-center justify-center font-mono font-bold text-xs">
                    CQ
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold font-mono text-cirqa-negro">
                        {selectedOrder.orderNumber || `CQ-${selectedOrder._id?.slice(-6).toUpperCase()}`}
                      </h3>
                      {renderPaymentBadge(selectedOrder.status)}
                    </div>
                    <span className="text-[11px] text-cirqa-negro/50 font-light block">
                      Registrada el {formatDate(selectedOrder.createdAt)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-cirqa-negro/60 hover:text-cirqa-negro rounded-full hover:bg-black/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido en 2 Columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-grow divide-y lg:divide-y-0 lg:divide-x divide-cirqa-negro/10">
                
                {/* Columna Izquierda: Datos del Comprador y Productos */}
                <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
                  {/* Datos del Comprador */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cirqa-negro/50 block">
                      Datos del Comprador
                    </span>

                    <div className="p-4 rounded-2xl bg-cirqa-surface border border-cirqa-negro/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-cirqa-negro/60">Nombre:</span>
                        <strong className="text-cirqa-negro font-semibold">
                          {selectedOrder.customer?.name || 'Sin especificar'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-cirqa-negro/60">Email:</span>
                        <strong className="text-cirqa-negro font-medium">
                          {selectedOrder.customer?.email || 'Sin especificar'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-cirqa-negro/60">Teléfono:</span>
                        <strong className="text-cirqa-negro font-medium">
                          {selectedOrder.customer?.phone || 'Sin especificar'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-cirqa-negro/60">DNI / CUIL:</span>
                        <strong className="text-cirqa-negro font-medium">
                          {selectedOrder.customer?.dni || 'Sin especificar'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Dirección de Entrega */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cirqa-negro/50 block">
                      Dirección de Entrega
                    </span>

                    <div className="p-4 rounded-2xl bg-cirqa-surface border border-cirqa-negro/5 text-xs text-cirqa-negro/80 space-y-1">
                      <p className="font-semibold text-cirqa-negro">
                        {selectedOrder.customer?.shippingAddress?.street || 'Sin calle especificada'}
                        {selectedOrder.customer?.shippingAddress?.floor
                          ? `, Piso ${selectedOrder.customer.shippingAddress.floor}`
                          : ''}
                        {selectedOrder.customer?.shippingAddress?.apartment
                          ? ` Depto ${selectedOrder.customer.shippingAddress.apartment}`
                          : ''}
                      </p>
                      <p className="font-light">
                        {selectedOrder.customer?.shippingAddress?.city || ''}
                        {selectedOrder.customer?.shippingAddress?.state
                          ? `, ${selectedOrder.customer.shippingAddress.state}`
                          : ''}
                        {selectedOrder.customer?.shippingAddress?.zipCode
                          ? ` (CP ${selectedOrder.customer.shippingAddress.zipCode})`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {/* Desglose de Productos */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cirqa-negro/50 block">
                      Productos Comprados ({selectedOrder.items?.length || 0})
                    </span>

                    <div className="space-y-3">
                      {(selectedOrder.items || []).map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-white border border-cirqa-negro/10 flex items-center gap-3.5 shadow-xs"
                        >
                          <div className="w-14 h-14 rounded-xl bg-cirqa-surface border border-cirqa-negro/5 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img
                              src={formatMediaUrl(item.image || item.product?.images?.[0]?.url)}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/products/_DSC8649.webp';
                              }}
                            />
                          </div>

                          <div className="flex-grow min-w-0 text-xs">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-cirqa-negro truncate">
                                {item.name}
                              </h4>
                              <span className="font-mono text-cirqa-negro font-bold">
                                ${((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString('es-AR')}
                              </span>
                            </div>

                            <p className="text-[11px] text-cirqa-negro/60 mt-0.5">
                              Modelo: <strong className="text-cirqa-negro font-mono">{item.modelCode || 'Q-001'}</strong> · Cantidad: {item.quantity || 1}
                            </p>

                            {item.filter && (
                              <p className="text-[11px] text-cirqa-primario font-medium">
                                Cristal: {item.filter}
                              </p>
                            )}

                            {item.prescription && (
                              <div className="mt-1 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800">
                                <span className="font-bold">Receta Oftalmológica:</span> {item.prescription}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="pt-3 border-t border-cirqa-negro/10 flex items-center justify-between text-xs">
                      <span className="text-cirqa-negro/60">Total de la Orden</span>
                      <span className="text-base font-extrabold text-cirqa-negro font-mono">
                        ${(Number(selectedOrder.totalAmount) || 0).toLocaleString('es-AR')} ARS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Envío y Logística */}
                <div className="lg:col-span-5 p-6 sm:p-8 bg-cirqa-surface/50 flex flex-col justify-between space-y-6">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 border-b border-cirqa-negro/10 pb-3">
                      <Truck className="w-4 h-4 text-cirqa-primario" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cirqa-negro">
                        Gestión de Envío y Logística
                      </h4>
                    </div>

                    <form onSubmit={handleSaveShipping} className="space-y-4">
                      {/* Estado de Entrega */}
                      <div>
                        <label className="block text-[11px] font-semibold text-cirqa-negro mb-1.5">
                          Estado de la Entrega *
                        </label>
                        <select
                          value={shippingForm.status}
                          onChange={(e) =>
                            setShippingForm((prev) => ({ ...prev, status: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-cirqa-negro/20 text-xs bg-white text-cirqa-negro focus:outline-none focus:border-cirqa-negro font-medium"
                        >
                          {SHIPPING_STATUSES.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Empresa de Transporte */}
                      <div>
                        <label className="block text-[11px] font-semibold text-cirqa-negro mb-1.5">
                          Empresa de Transporte / Correo
                        </label>
                        <input
                          type="text"
                          value={shippingForm.carrier}
                          onChange={(e) =>
                            setShippingForm((prev) => ({ ...prev, carrier: e.target.value }))
                          }
                          placeholder="Ej: Correo Argentino, Andreani, OCA"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-cirqa-negro/20 text-xs bg-white text-cirqa-negro focus:outline-none focus:border-cirqa-negro"
                        />
                      </div>

                      {/* Número de Seguimiento (Tracking ID) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-cirqa-negro mb-1.5">
                          Número de Seguimiento (Tracking ID)
                        </label>
                        <input
                          type="text"
                          value={shippingForm.trackingNumber}
                          onChange={(e) =>
                            setShippingForm((prev) => ({
                              ...prev,
                              trackingNumber: e.target.value,
                            }))
                          }
                          placeholder="Ej: AR0987654321"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-cirqa-negro/20 text-xs bg-white text-cirqa-negro focus:outline-none focus:border-cirqa-negro font-mono"
                        />
                      </div>

                      {/* Botón Guardar Cambios de Envío */}
                      <button
                        type="submit"
                        disabled={savingShipping}
                        className="w-full bg-cirqa-negro hover:bg-cirqa-negro/85 text-white font-bold text-xs tracking-wider uppercase py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {savingShipping ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Guardando Envío...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Guardar Cambios de Envío</span>
                          </>
                        )}
                      </button>
                    </form>

                    <div className="p-4 rounded-2xl bg-white border border-cirqa-negro/10 text-xs text-cirqa-negro/70 space-y-1.5 font-light">
                      <span className="font-semibold text-cirqa-negro block text-[11px] uppercase tracking-wider">
                        Pasarela & Facturación
                      </span>
                      <p>Método de Pago: <strong>{selectedOrder.paymentMethod || 'MERCADO_PAGO'}</strong></p>
                      {selectedOrder.gateway_id && (
                        <p className="font-mono text-[10px] truncate text-cirqa-negro/60">
                          Gateway ID: {selectedOrder.gateway_id}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-cirqa-negro/10">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="w-full py-2.5 rounded-xl border border-cirqa-negro/15 text-xs text-cirqa-negro/70 hover:text-cirqa-negro hover:bg-black/5 transition-colors"
                    >
                      Cerrar Detalle
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
