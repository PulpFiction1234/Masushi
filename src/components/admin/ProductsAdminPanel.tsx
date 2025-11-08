"use client";

import React, { useEffect, useMemo, useState } from "react";
import { productos, type Producto } from "@/data/productos";
import { normalize } from "@/utils/strings";

type AdminProducto = Producto & { enabled?: boolean };

export default function ProductsAdminPanel() {
  const [items, setItems] = useState<AdminProducto[]>(() => productos.map((p: Producto) => ({ ...(p as AdminProducto), enabled: (p as AdminProducto).enabled ?? true })));
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/admin/product-overrides');
        if (!r.ok) return;
        const json = await r.json();
        const map = new Map<string, boolean>();

  const rawOverrides: Array<Record<string, unknown>> = (json.overrides || json.data || []);
        rawOverrides.forEach((o) => {
          const codigo = typeof o?.codigo === 'string' ? o.codigo : String(o?.codigo ?? '');
          if (codigo) map.set(codigo, !!o?.enabled);
        });

  if (!mounted) return;
  setItems(productos.map((p: Producto) => ({ ...(p as AdminProducto), enabled: map.has(p.codigo) ? (map.get(p.codigo) as boolean) : ((p as AdminProducto).enabled ?? true) })));
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggle = (codigo: string) => {
    setItems((prev) => {
      const prevItem = prev.find((x) => x.codigo === codigo) as AdminProducto | undefined;
      const oldEnabled = prevItem ? !!prevItem.enabled : true;
      const newEnabled = !oldEnabled;
      const next = prev.map((p: AdminProducto) => (p.codigo === codigo ? { ...p, enabled: newEnabled } : p));

      setLoadingMap((m) => ({ ...m, [codigo]: true }));

      // Persist to localStorage immediately so dev setups without Supabase still receive the override via window event
      try {
        const raw = localStorage.getItem('product-overrides-map');
        const parsed = raw ? JSON.parse(raw) as Record<string, boolean> : {};
        parsed[codigo] = newEnabled;
        localStorage.setItem('product-overrides-map', JSON.stringify(parsed));
      } catch {}

      try { localStorage.setItem('product-overrides-updated', String(Date.now())); } catch {}

      try {
        window.dispatchEvent(new CustomEvent('product-overrides-changed', { detail: { codigo, enabled: newEnabled } }));
      } catch {
        window.dispatchEvent(new Event('product-overrides-changed'));
      }

      (async () => {
        try {
          const r = await fetch('/api/admin/product-overrides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo, enabled: newEnabled }) });
          if (!r.ok) throw new Error('failed');
        } catch {
          // revert UI and notify admin if server persistence failed
          setItems((cur) => cur.map((p: AdminProducto) => (p.codigo === codigo ? { ...p, enabled: oldEnabled } : p)));
          alert('Error guardando override en el servidor (si el servidor está configurado). Cambio aplicado localmente.');
        } finally {
          setLoadingMap((m) => {
            const copy = { ...m };
            delete copy[codigo];
            return copy;
          });
        }
      })();

      return next;
    });
  };

  const queryNorm = normalize(query).trim();
  const tokens = useMemo(() => queryNorm.split(/\s+/).filter(Boolean), [queryNorm]);

  const filtered = useMemo(() => {
    if (tokens.length === 0) return items;
    return items.filter((p: AdminProducto) => {
      const nombre = normalize(p.nombre);
      const desc = normalize(p.descripcion ?? "");
      const cod = normalize(p.codigo ?? "");
      return tokens.every((t) => nombre.includes(t) || desc.includes(t) || cod.includes(t));
    });
  }, [items, tokens]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs md:text-sm text-gray-300">Habilita o deshabilita productos. Los cambios se aplican inmediatamente para los clientes.</p>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar..." className="bg-gray-800 placeholder-gray-400 text-xs md:text-sm px-3 py-2 rounded w-full sm:w-64 md:w-72" />
      </div>

      <div className="mt-4">
        <div className="grid gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-800 p-3 rounded gap-3">
              <div className="flex-1">
                <div className="text-xs md:text-sm font-semibold">{p.nombre} <span className="text-xs text-gray-400">{p.codigo}</span></div>
                <div className="text-xs text-gray-400 break-words">{p.descripcion}</div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-semibold flex-1 sm:flex-none text-center ${p.enabled ? 'bg-emerald-700 text-white' : 'bg-rose-700 text-white'}`}>{p.enabled ? 'HABILITADO' : 'DESHABILITADO'}</div>
                <button disabled={!!loadingMap[p.codigo]} onClick={() => toggle(p.codigo)} className={`px-2 md:px-3 py-1 ${loadingMap[p.codigo] ? 'bg-yellow-500' : 'bg-blue-600 hover:bg-blue-700'} rounded text-xs md:text-sm font-semibold flex-1 sm:flex-none whitespace-nowrap`}>
                  {loadingMap[p.codigo] ? (p.enabled ? 'Deshabilitando...' : 'Habilitando...') : (p.enabled ? 'Deshabilitar' : 'Habilitar')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
