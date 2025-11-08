"use client";

import React, { useEffect, useState } from "react";
import { HORARIO_SEMANAL, OVERRIDES } from '@/utils/horarios';

export default function HorariosAdminPanel() {
  const [text, setText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'normal'|'forceOpen'|'forceClosed'>('normal');
  const [loadingMode, setLoadingMode] = useState(true);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/admin/horarios');
        if (!r.ok) {
          // fallback to repo defaults
          if (mounted) setText(JSON.stringify({ weekly: HORARIO_SEMANAL, overrides: OVERRIDES }, null, 2));
          return;
        }
        const j = await r.json();
        const val = j.settings ?? { weekly: HORARIO_SEMANAL, overrides: OVERRIDES };
        if (mounted) setText(JSON.stringify(val, null, 2));
      } catch {
        if (mounted) setText(JSON.stringify({ weekly: HORARIO_SEMANAL, overrides: OVERRIDES }, null, 2));
      }
    })();

    // load current admin mode and listen for cross-tab changes
    const loadMode = async () => {
      try {
        const r = await fetch('/api/admin/mode', { cache: 'no-store' });
        if (!r.ok) { setLoadingMode(false); return; }
        const j = await r.json();
        if (mounted) setMode(j.mode ?? 'normal');
      } catch (e) {
        // ignore
      } finally { if (mounted) setLoadingMode(false); }
    };
    loadMode();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'admin-mode-updated' || e.key === 'product-overrides-updated') {
        loadMode();
      }
    };

    const onEvent = () => { loadMode(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('admin-mode-changed', onEvent as EventListener);
    return () => { mounted = false; window.removeEventListener('storage', onStorage); window.removeEventListener('admin-mode-changed', onEvent as EventListener); };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('No se pudo copiar al portapapeles');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(text);
      const r = await fetch('/api/admin/horarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: parsed }) });
      if (!r.ok) throw new Error('failed');
      alert('Horarios guardados');
    } catch (e) {
      console.error(e);
      alert('Error guardando horarios. Revisa el JSON.');
    } finally { setSaving(false); }
  };

  const applyMode = async (next: 'normal'|'forceOpen'|'forceClosed') => {
    const prev = mode;
    setMode(next);
    try {
      const r = await fetch('/api/admin/mode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: next }) });
      if (!r.ok) throw new Error('failed');
      const j = await r.json();
      setMode(j.mode ?? 'normal');
      try {
        try { localStorage.setItem('admin-mode-updated', String(Date.now())); } catch {}
        window.dispatchEvent(new Event('admin-mode-changed'));
      } catch {}
    } catch (e) {
      console.error(e);
      alert('Error actualizando el estado');
      setMode(prev);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs md:text-sm text-gray-300">Control de horarios (modo de apertura)</p>
          <p className="text-xs text-gray-400">Estado actual: <span className="font-semibold">{loadingMode ? 'cargando...' : (mode === 'forceOpen' ? 'FORZADO ABIERTO' : mode === 'forceClosed' ? 'FORZADO CERRADO' : 'NORMAL (según horario)')}</span></p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button disabled={loadingMode} onClick={() => applyMode('normal')} className={`px-3 md:px-4 py-2 rounded font-semibold border text-xs md:text-sm ${mode === 'normal' ? 'bg-emerald-600 border-emerald-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}>Normal<div className="text-xs text-gray-200 font-normal">Respeta horario</div></button>
          <button disabled={loadingMode} onClick={() => applyMode('forceOpen')} className={`px-3 md:px-4 py-2 rounded font-semibold border text-xs md:text-sm ${mode === 'forceOpen' ? 'bg-green-700 border-green-600' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}>Forzar ABIERTO<div className="text-xs text-gray-200 font-normal">Solo hoy</div></button>
          <button disabled={loadingMode} onClick={() => applyMode('forceClosed')} className={`px-3 md:px-4 py-2 rounded font-semibold border text-xs md:text-sm ${mode === 'forceClosed' ? 'bg-rose-700 border-rose-600' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}>Forzar CERRADO<div className="text-xs text-gray-200 font-normal">Solo hoy</div></button>
        </div>
      </div>

      <div className="bg-gray-800 p-3 rounded">
        <div className="flex items-center justify-between">
          <p className="text-xs md:text-sm text-gray-300">Editor de horarios (oculto por defecto)</p>
          <button onClick={() => setShowJson((s) => !s)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm">{showJson ? 'Ocultar JSON' : 'Mostrar JSON'}</button>
        </div>
        {showJson && (
          <>
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-64 bg-gray-800 p-3 rounded text-xs md:text-sm text-gray-100 font-mono mt-3" />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-3">
              <button onClick={copy} className="px-3 md:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded font-semibold text-xs md:text-sm">{copied ? 'Copiado' : 'Copiar JSON'}</button>
              <button onClick={() => { setText(JSON.stringify({ weekly: HORARIO_SEMANAL, overrides: OVERRIDES }, null, 2)); }} className="px-3 md:px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm">Restaurar valores</button>
              <button onClick={save} disabled={saving} className="px-3 md:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded font-semibold text-xs md:text-sm">{saving ? 'Guardando...' : 'Guardar en servidor'}</button>
            </div>
            <p className="text-xs text-gray-400 mt-2 break-words">Al guardar se persiste en la tabla <code>app_settings</code>. El código que usa estos horarios debe leer de la DB o aplicar cambios según tu deployment.</p>
          </>
        )}
      </div>
    </div>
  );
}
