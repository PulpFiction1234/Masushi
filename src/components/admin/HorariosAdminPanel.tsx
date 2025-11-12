"use client";

import React, { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { HORARIO_SEMANAL, OVERRIDES } from '@/utils/horarios';
import { useAdminMode, type AdminMode } from '@/hooks/useAdminMode';

type ScheduleSettings = {
  weekly: typeof HORARIO_SEMANAL;
  overrides: typeof OVERRIDES;
};

const DEFAULT_SETTINGS: ScheduleSettings = {
  weekly: HORARIO_SEMANAL,
  overrides: OVERRIDES,
};

const DEFAULT_SERIALIZED = JSON.stringify(DEFAULT_SETTINGS, null, 2);

const scheduleFetcher = async (url: string): Promise<ScheduleSettings> => {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return DEFAULT_SETTINGS;
    }
    const json = await response.json();
    const settings = json?.settings;
    if (settings && typeof settings === 'object') {
      return {
        weekly: settings.weekly ?? HORARIO_SEMANAL,
        overrides: settings.overrides ?? OVERRIDES,
      } as ScheduleSettings;
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export default function HorariosAdminPanel() {
  const [text, setText] = useState<string>(DEFAULT_SERIALIZED);
  const [copied, setCopied] = useState(false);
  const [savingJson, setSavingJson] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const lastSyncedRef = useRef<string>(DEFAULT_SERIALIZED);

  const { data: scheduleData, mutate: mutateSchedule } = useSWR<ScheduleSettings>(
    '/api/admin/horarios',
    scheduleFetcher,
    {
      fallbackData: DEFAULT_SETTINGS,
      revalidateOnFocus: false,
    },
  );

  const { mode, loading: modeLoading, setMode, refresh } = useAdminMode();

  useEffect(() => {
    if (!scheduleData) return;
    const serialized = JSON.stringify(scheduleData, null, 2);
    const previousSynced = lastSyncedRef.current;
    lastSyncedRef.current = serialized;
    setText((current) => (current === previousSynced ? serialized : current));
  }, [scheduleData]);

  useEffect(() => {
    const syncMode = () => { refresh(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'admin-mode-updated' || event.key === 'product-overrides-updated') {
        syncMode();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('admin-mode-changed', syncMode);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('admin-mode-changed', syncMode);
    };
  }, [refresh]);

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
    setSavingJson(true);
    try {
      const parsed = JSON.parse(text) as ScheduleSettings;
      await mutateSchedule(
        async () => {
          const response = await fetch('/api/admin/horarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: parsed }),
          });
          if (!response.ok) {
            throw new Error('Failed to persist schedules');
          }
          return parsed;
        },
        {
          optimisticData: parsed,
          rollbackOnError: true,
          revalidate: false,
        },
      );
      const serialized = JSON.stringify(parsed, null, 2);
      lastSyncedRef.current = serialized;
      setText(serialized);
      alert('Horarios guardados');
    } catch (error) {
      console.error(error);
      alert('Error guardando horarios. Revisa el JSON.');
    } finally {
      setSavingJson(false);
    }
  };

  const applyMode = async (next: AdminMode) => {
    setSavingMode(true);
    try {
      await setMode(next);
    } catch (error) {
      console.error(error);
      alert('Error actualizando el estado');
    } finally {
      setSavingMode(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs md:text-sm text-gray-300">Control de horarios (modo de apertura)</p>
          <p className="text-xs text-gray-400">Estado actual: <span className="font-semibold">{modeLoading ? 'cargando...' : (mode === 'forceOpen' ? 'FORZADO ABIERTO' : mode === 'forceClosed' ? 'FORZADO CERRADO' : 'NORMAL (según horario)')}</span></p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button disabled={modeLoading || savingMode} onClick={() => applyMode('normal')} className={`px-3 md:px-4 py-2 rounded font-semibold border text-xs md:text-sm ${mode === 'normal' ? 'bg-emerald-600 border-emerald-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}>Normal<div className="text-xs text-gray-200 font-normal">Respeta horario</div></button>
          <button disabled={modeLoading || savingMode} onClick={() => applyMode('forceOpen')} className={`px-3 md:px-4 py-2 rounded font-semibold border text-xs md:text-sm ${mode === 'forceOpen' ? 'bg-green-700 border-green-600' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}>Forzar ABIERTO<div className="text-xs text-gray-200 font-normal">Solo hoy</div></button>
          <button disabled={modeLoading || savingMode} onClick={() => applyMode('forceClosed')} className={`px-3 md:px-4 py-2 rounded font-semibold border text-xs md:text-sm ${mode === 'forceClosed' ? 'bg-rose-700 border-rose-600' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}>Forzar CERRADO<div className="text-xs text-gray-200 font-normal">Solo hoy</div></button>
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
              <button onClick={() => { setText(DEFAULT_SERIALIZED); lastSyncedRef.current = DEFAULT_SERIALIZED; }} className="px-3 md:px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm">Restaurar valores</button>
              <button onClick={save} disabled={savingJson} className="px-3 md:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded font-semibold text-xs md:text-sm">{savingJson ? 'Guardando...' : 'Guardar en servidor'}</button>
            </div>
            <p className="text-xs text-gray-400 mt-2 break-words">Al guardar se persiste en la tabla <code>app_settings</code>. El código que usa estos horarios debe leer de la DB o aplicar cambios según tu deployment.</p>
          </>
        )}
      </div>
    </div>
  );
}
