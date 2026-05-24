"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { parseGoogleMapsCoords } from '@/utils/parseGoogleMapsCoords';

interface AddressOverride {
  id: number;
  display_label: string;
  lng: number;
  lat: number;
  created_at: string;
}

const fetcher = async (url: string): Promise<AddressOverride[]> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error cargando overrides');
  const json = await res.json();
  return json.overrides ?? [];
};

export default function AddressOverridesPanel() {
  const { data, isLoading, mutate } = useSWR<AddressOverride[]>(
    '/api/admin/address-overrides',
    fetcher,
    { revalidateOnFocus: false }
  );

  const [label, setLabel] = useState('');
  const [coordInput, setCoordInput] = useState('');
  const [parsedCoords, setParsedCoords] = useState<[number, number] | null>(null);
  const [parseError, setParseError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCoordInputChange = (value: string) => {
    setCoordInput(value);
    setParseError('');
    if (!value.trim()) { setParsedCoords(null); return; }
    const coords = parseGoogleMapsCoords(value);
    if (coords) {
      setParsedCoords(coords);
    } else {
      setParsedCoords(null);
      if (value.trim().length > 5) setParseError('No se reconoce el formato. Pega el enlace de Google Maps o las coordenadas.');
    }
  };

  const handleAdd = async () => {
    setError(''); setSuccess('');
    if (!label.trim()) { setError('El nombre de la dirección es requerido.'); return; }
    if (!parsedCoords) { setError('Coordenadas no válidas.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/address-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_label: label.trim(), lng: parsedCoords[0], lat: parsedCoords[1] }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Error guardando'); return; }
      setSuccess(`"${label.trim()}" agregada correctamente.`);
      setLabel(''); setCoordInput(''); setParsedCoords(null);
      await mutate();
    } catch {
      setError('Error de red al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, lbl: string) => {
    if (!window.confirm(`Eliminar override "${lbl}"?`)) return;
    setError(''); setSuccess('');
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/address-overrides?id=${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok) { setError(json?.error || 'Error eliminando'); return; }
      setSuccess(`"${lbl}" eliminada.`);
      await mutate();
    } catch {
      setError('Error de red al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  const list = data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-[#93C021]">Zona de reparto</p>
        <h2 className="text-xl font-bold text-white">Direcciones manuales</h2>
        <p className="text-sm text-gray-400 mt-1">
          Agrega aquí las direcciones que Mapbox no reconoce correctamente. Los clientes también verán estas
          opciones al buscar su dirección en el checkout.
        </p>
      </div>

      {/* Formulario de agregar */}
      <div className="rounded-2xl border border-white/10 bg-[#111111]/80 p-4 space-y-3">
        <p className="text-sm font-semibold text-white">Agregar dirección</p>
        <p className="text-xs text-gray-400">
          Para obtener coordenadas: abre <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-[#D1933E] hover:underline">Google Maps</a>,
          haz clic derecho en el domicilio exacto → <strong>"¿Qué hay aquí?"</strong> → copia el número que aparece abajo (ej: <code className="text-gray-300">-33.57762, -70.53602</code>) o copia la URL.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Nombre de la dirección</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ej: Av. Paseo Pie Andino 3286, Puente Alto"
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#93C021]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Enlace de Google Maps o coordenadas</label>
            <input
              value={coordInput}
              onChange={e => handleCoordInputChange(e.target.value)}
              placeholder="-33.57762, -70.53602  o  https://maps.google.com/..."
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#93C021]"
            />
            {parsedCoords && (
              <p className="text-xs text-[#93C021]">
                ✓ lng: {parsedCoords[0].toFixed(6)}, lat: {parsedCoords[1].toFixed(6)}
              </p>
            )}
            {parseError && <p className="text-xs text-yellow-300">{parseError}</p>}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-[#93C021]">{success}</p>}

        <button
          type="button"
          onClick={handleAdd}
          disabled={saving || !label.trim() || !parsedCoords}
          className="rounded-lg bg-[#93C021] hover:bg-[#7fa01c] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition-colors"
        >
          {saving ? 'Guardando…' : 'Agregar dirección'}
        </button>
      </div>

      {/* Lista */}
      <div className="rounded-2xl border border-white/10 bg-[#111111]/70 p-4">
        <p className="text-sm font-semibold text-white mb-3">
          Direcciones registradas{' '}
          <span className="text-gray-400 font-normal">({list.length})</span>
        </p>

        {isLoading ? (
          <p className="text-sm text-gray-400">Cargando…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-gray-400">Sin overrides. Agrega la primera arriba.</p>
        ) : (
          <div className="space-y-2">
            {list.map(ov => (
              <div key={ov.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#1a1a1a]/60 px-4 py-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-white">{ov.display_label}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    lng: {ov.lng.toFixed(6)}, lat: {ov.lat.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Agregada: {new Date(ov.created_at).toLocaleString('es-CL')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(ov.id, ov.display_label)}
                  disabled={deleting === ov.id}
                  className="shrink-0 rounded-lg border border-rose-500/50 px-3 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-500/10 disabled:opacity-50 transition-colors"
                >
                  {deleting === ov.id ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
