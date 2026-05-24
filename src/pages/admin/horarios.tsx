import React, { useState } from 'react';
import Seo from '@/components/Seo';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminMode, type AdminMode } from '@/hooks/useAdminMode';

export default function AdminHorariosPage() {
  const { mode, loading, setMode } = useAdminMode();
  const [saving, setSaving] = useState(false);

  const changeMode = async (next: AdminMode) => {
    setSaving(true);
    try {
      await setMode(next);
    } catch {
      alert('Error cambiando modo');
    } finally {
      setSaving(false);
    }
  };

  const buttonClass = (active: boolean) => `w-full sm:w-56 text-left px-6 py-4 rounded ${active ? 'bg-[#93C021] text-white' : 'bg-[#1a1a1a] text-gray-200'} border border-[#2a2a2a]`;

  return (
    <div>
      <Seo title="Admin — Horarios" canonicalPath="/admin/horarios" noIndex />
      <AdminLayout title="Horarios">
        <div className="bg-[#111111] p-6 rounded-xl shadow space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Panel de pedidos</h2>
              <p className="text-sm text-gray-300 mt-2">Modo actual: <span className="font-semibold">{loading ? 'cargando...' : mode === 'normal' ? 'NORMAL (según horario)' : mode === 'forceOpen' ? 'FORZAR ABIERTO' : 'FORZAR CERRADO'}</span></p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <button disabled={saving || loading} onClick={() => changeMode('normal')} className={buttonClass(mode === 'normal')}>
              <div className="text-lg font-semibold">Normal</div>
              <div className="text-xs text-gray-300">Respeta horario</div>
            </button>

            <button disabled={saving || loading} onClick={() => changeMode('forceOpen')} className={buttonClass(mode === 'forceOpen')}>
              <div className="text-lg font-semibold">Forzar ABIERTO</div>
              <div className="text-xs text-gray-300">Solo hoy</div>
            </button>

            <button disabled={saving || loading} onClick={() => changeMode('forceClosed')} className={buttonClass(mode === 'forceClosed')}>
              <div className="text-lg font-semibold">Forzar CERRADO</div>
              <div className="text-xs text-gray-300">Solo hoy</div>
            </button>
          </div>

          <p className="text-xs text-gray-400">* Los modos &quot;Forzar&quot; se limpian automáticamente al cambiar el día en America/Santiago.</p>
        </div>
      </AdminLayout>
    </div>
  );
}
