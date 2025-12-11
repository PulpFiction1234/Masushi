"use client";

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { fmt } from '@/utils/checkout';

interface AdminGiftCard {
  id: number;
  code: string;
  amount_total: number;
  amount_remaining: number;
  status: 'pending' | 'active' | 'disabled' | 'exhausted';
  purchased_by_user_id: string | null;
  purchaser_email: string | null;
  purchaser_name: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  claimed_by_user_id: string | null;
  claimed_at: string | null;
  activated_at: string | null;
  activated_by: string | null;
  created_at: string;
  updated_at: string;
  usage_total?: number;
  usage_count?: number;
  last_used_at?: string | null;
}

const fetcher = async (url: string): Promise<AdminGiftCard[]> => {
  const resp = await fetch(url, { cache: 'no-store' });
  if (!resp.ok) throw new Error('No se pudieron cargar las gift cards');
  const json = await resp.json();
  return (json?.giftCards ?? []) as AdminGiftCard[];
};

export default function GiftCardsAdminPanel() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [query, setQuery] = useState('');
  const { data, isLoading, mutate } = useSWR<AdminGiftCard[]>(
    `/api/admin/giftcards${statusFilter ? `?status=${statusFilter}` : ''}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const list = data ?? [];
  const tokens = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter(Boolean), [query]);

  const filtered = useMemo(() => {
    if (tokens.length === 0) return list;
    return list.filter((gc) => {
      const haystack = [
        gc.code,
        gc.purchaser_email ?? '',
        gc.recipient_email ?? '',
        gc.purchaser_name ?? '',
        gc.recipient_name ?? '',
        gc.status,
      ].join(' ').toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [list, tokens]);

  const summary = useMemo(() => {
    const base = { total: list.length, pending: 0, active: 0, exhausted: 0, disabled: 0 };
    list.forEach((gc) => {
      base[gc.status] = (base as any)[gc.status] + 1;
    });
    return base;
  }, [list]);

  const activate = async (code: string) => {
    setError(null);
    setSuccess(null);
    setActivating(code);
    try {
      const resp = await fetch('/api/admin/giftcards/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setError(json?.error || 'No se pudo activar');
        return;
      }
      setSuccess(`Gift card ${code} activada${json?.notified ? ' y correo enviado' : ''}.`);
      await mutate();
    } catch (e) {
      console.error('Error activando', e);
      setError('No se pudo activar la gift card');
    } finally {
      setActivating(null);
    }
  };

  const remove = async (code: string) => {
    if (!window.confirm(`Eliminar gift card ${code}? Esta acción es permanente.`)) return;
    setError(null);
    setSuccess(null);
    setDeleting(code);
    try {
      const resp = await fetch('/api/admin/giftcards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) {
        setError(json?.error || 'No se pudo eliminar');
        return;
      }
      setSuccess(`Gift card ${code} eliminada.`);
      await mutate();
    } catch (e) {
      console.error('Error eliminando', e);
      setError('No se pudo eliminar la gift card');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-lime-300">Gift cards</p>
          <h2 className="text-xl font-bold text-white">Activación y estado</h2>
          <p className="text-sm text-gray-400">Activa las pendientes y revisa saldo/uso.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            <option value="">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="active">Activas</option>
            <option value="exhausted">Agotadas</option>
            <option value="disabled">Desactivadas</option>
          </select>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código/correo"
            className="rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-gray-900/80 p-3">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-lg font-semibold text-white">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-lime-400/30 bg-lime-500/10 p-3">
          <p className="text-xs text-lime-200">Pendientes</p>
          <p className="text-lg font-semibold text-lime-50">{summary.pending}</p>
        </div>
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-200">Activas</p>
          <p className="text-lg font-semibold text-emerald-50">{summary.active}</p>
        </div>
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3">
          <p className="text-xs text-amber-200">Agotadas</p>
          <p className="text-lg font-semibold text-amber-50">{summary.exhausted}</p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-green-300">{success}</p> : null}

      <div className="rounded-2xl border border-white/10 bg-gray-900/70 p-3 md:p-4">
        {isLoading ? (
          <p className="text-sm text-gray-400">Cargando gift cards...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400">Sin resultados.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((gc) => {
              const canActivate = gc.status === 'pending' || gc.status === 'disabled';
              const lastUseLabel = gc.last_used_at ? new Date(gc.last_used_at).toLocaleString('es-CL') : '—';
              const activatedLabel = gc.activated_at ? new Date(gc.activated_at).toLocaleString('es-CL') : '—';
              const createdLabel = gc.created_at ? new Date(gc.created_at).toLocaleString('es-CL') : '—';
              const usageTotal = gc.usage_total ?? (gc.amount_total - gc.amount_remaining);
              const usageCount = gc.usage_count ?? 0;
              return (
                <div key={gc.id} className="rounded-xl border border-white/10 bg-gray-800/60 p-3 md:p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">Código: <span className="font-mono">{gc.code}</span></p>
                      <p className="text-xs text-gray-300">Monto: {fmt(gc.amount_total)} · Saldo: {fmt(gc.amount_remaining)}</p>
                      <p className="text-xs text-gray-400">Comprador: {gc.purchaser_email || '—'} {gc.purchaser_name ? `(${gc.purchaser_name})` : ''}</p>
                      <p className="text-xs text-gray-400">Destinatario: {gc.recipient_email || '—'} {gc.recipient_name ? `(${gc.recipient_name})` : ''}</p>
                      <p className="text-xs text-gray-400">Claim: {gc.claimed_by_user_id ? `asociada (${gc.claimed_by_user_id})` : 'sin asociar'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-3 py-1 font-semibold ${gc.status === 'pending' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30' : gc.status === 'active' ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30' : gc.status === 'exhausted' ? 'bg-gray-500/20 text-gray-200 border border-gray-400/30' : 'bg-rose-500/20 text-rose-100 border border-rose-400/30'}`}>
                        {gc.status}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-gray-200">Usos: {usageCount}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-gray-200">Consumido: {fmt(usageTotal)}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-gray-400 md:grid-cols-3">
                    <div>Creada: {createdLabel}</div>
                    <div>Activada: {activatedLabel}</div>
                    <div>Último uso: {lastUseLabel}</div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {canActivate ? (
                      <button
                        type="button"
                        onClick={() => activate(gc.code)}
                        disabled={activating === gc.code}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {activating === gc.code ? 'Activando…' : 'Activar y enviar correo'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => remove(gc.code)}
                      disabled={deleting === gc.code}
                      className="rounded-lg border border-rose-500/60 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-500/10 disabled:opacity-60"
                    >
                      {deleting === gc.code ? 'Eliminando…' : 'Eliminar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(gc.code).catch(() => {})}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-200 hover:bg-white/5"
                    >
                      Copiar código
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
