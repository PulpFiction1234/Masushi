import React, { useEffect, useState } from 'react';
import Seo from '@/components/Seo';
import AdminLayout from '@/components/admin/AdminLayout';

type Mode = 'normal' | 'forceOpen' | 'forceClosed';

export default function AdminHorariosPage() {
  const [mode, setMode] = useState<Mode>('normal');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/mode');
        if (!r.ok) return;
        const j = await r.json();
        setMode(j.mode);
      } catch {}
    })();
  }, []);

  const changeMode = async (m: Mode) => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/mode', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ mode: m }) });
      if (!r.ok) throw new Error('failed');
      const j = await r.json();
      setMode(j.mode);
    } catch {
      alert('Error cambiando modo');
    } finally { setSaving(false); }
  };

  const buttonClass = (active: boolean) => `w-56 text-left px-6 py-4 rounded ${active ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-200'} border border-gray-700`;

  return (
    <div>
      <Seo title="Admin — Horarios" canonicalPath="/admin/horarios" noIndex />
      <AdminLayout title="Horarios">
        <div className="bg-gray-900 p-6 rounded-xl shadow space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Panel de pedidos</h2>
              <p className="text-sm text-gray-300 mt-2">Modo actual: <span className="font-semibold">{mode === 'normal' ? 'NORMAL (según horario)' : mode === 'forceOpen' ? 'FORZAR ABIERTO' : 'FORZAR CERRADO'}</span></p>
            </div>
          </div>

          <div className="flex gap-3">
            <button disabled={saving} onClick={() => changeMode('normal')} className={buttonClass(mode === 'normal')}>
              <div className="text-lg font-semibold">Normal</div>
              <div className="text-xs text-gray-300">Respeta horario</div>
            </button>

            <button disabled={saving} onClick={() => changeMode('forceOpen')} className={buttonClass(mode === 'forceOpen')}>
              <div className="text-lg font-semibold">Forzar ABIERTO</div>
              <div className="text-xs text-gray-300">Solo hoy</div>
            </button>

            <button disabled={saving} onClick={() => changeMode('forceClosed')} className={buttonClass(mode === 'forceClosed')}>
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
