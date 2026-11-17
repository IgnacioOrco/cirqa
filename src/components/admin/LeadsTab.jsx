import React, { useState, useEffect, useCallback } from 'react';
import { Users, Download, Search, Loader2, RefreshCw } from 'lucide-react';
import { leadService } from '../../services/api';

export default function LeadsTab({ showToast }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadService.getAll();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setLeads(list);
    } catch (err) {
      if (showToast) {
        showToast(err?.message || 'Error al cargar los leads.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = leads.filter((lead) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (lead.name || '').toLowerCase().includes(q) ||
      (lead.email || '').toLowerCase().includes(q) ||
      (lead.couponCode || '').toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      if (showToast) showToast('No hay leads para exportar.', 'error');
      return;
    }

    const headers = ['Nombre', 'Email', 'Cupón', 'Fecha de Registro'];
    const escapeCSV = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = filteredLeads.map((lead) => [
      escapeCSV(lead.name),
      escapeCSV(lead.email),
      escapeCSV(lead.couponCode || 'BIENVENIDA5'),
      escapeCSV(lead.createdAt ? new Date(lead.createdAt).toLocaleString('es-AR') : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cirqa-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (showToast) showToast(`CSV exportado (${filteredLeads.length} leads).`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Barra de acciones */}
      <div className="bg-white rounded-3xl border border-cirqa-negro/10 p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-cirqa-negro/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o cupón..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-cirqa-negro/10 bg-[#FAF9F6] focus:bg-white focus:border-cirqa-primario focus:outline-none text-xs text-cirqa-negro"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchLeads}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-cirqa-negro/15 hover:bg-cirqa-negro/5 text-xs font-semibold text-cirqa-negro transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cirqa-negro hover:bg-cirqa-primario text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Tabla de Leads */}
      <div className="bg-white rounded-3xl border border-cirqa-negro/10 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-cirqa-negro/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-cirqa-primario" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-cirqa-negro">
              Leads Capturados
            </h2>
          </div>
          <span className="text-xs font-mono text-cirqa-negro/60">
            {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-xs text-cirqa-negro/60">
            <Loader2 className="w-4 h-4 animate-spin text-cirqa-primario" />
            <span>Cargando leads...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-xs text-cirqa-negro/50">
            No se encontraron leads registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-cirqa-negro/10 text-[10px] uppercase tracking-wider text-cirqa-negro/60">
                  <th className="py-3.5 px-6 font-bold">Nombre</th>
                  <th className="py-3.5 px-6 font-bold">Email</th>
                  <th className="py-3.5 px-6 font-bold">Cupón</th>
                  <th className="py-3.5 px-6 font-bold text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cirqa-negro/5 text-xs">
                {filteredLeads.map((lead) => (
                  <tr key={lead._id || lead.email} className="hover:bg-[#FAF9F6]/60 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-cirqa-negro">{lead.name || '-'}</td>
                    <td className="py-3.5 px-6 text-cirqa-negro/80">{lead.email}</td>
                    <td className="py-3.5 px-6">
                      <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-full bg-cirqa-primario/10 text-cirqa-primario border border-cirqa-primario/20">
                        {lead.couponCode || 'BIENVENIDA5'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-[11px] text-cirqa-negro/60">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleString('es-AR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
