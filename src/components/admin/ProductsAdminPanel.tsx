"use client";

import React, { useEffect, useMemo, useState } from "react";
import { productos, type Producto } from "@/data/productos";
import ListaProductos from "@/components/ListaProductos";
import { normalize } from "@/utils/strings";
import { matchesTokens } from "@/utils/search";

export default function ProductsAdminPanel() {
  const [items, setItems] = useState<Producto[]>(() => productos.map((p) => ({ ...p, enabled: p.enabled ?? true })));
  const [loading, setLoading] = useState(false);
  // per-product loading state so admin sees per-button feedback
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
        (json.overrides || json.data || []).forEach((o: any) => { if (o && o.codigo) map.set(o.codigo, !!o.enabled); });
        if (!mounted) return;
        setItems(productos.map((p) => ({ ...p, enabled: map.has(p.codigo) ? (map.get(p.codigo) as boolean) : (p.enabled ?? true) })));
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Keep admin panel in sync when overrides change elsewhere (other tab/admin)
  useEffect(() => {
    const onEvent = (ev?: Event) => {
      try {
        const ce = ev as CustomEvent | undefined;
        if (ce && (ce as any).detail && (ce as any).detail.codigo) {
          const d = (ce as any).detail as { codigo: string; enabled: boolean };
          setItems((cur) => cur.map((p) => (p.codigo === d.codigo ? { ...p, enabled: !!d.enabled } : p)));
          return;
        }
      } catch {}

      // fallback: read localStorage map and apply
      try {
        const raw = localStorage.getItem('product-overrides-map');
        const parsed = raw ? JSON.parse(raw) as Record<string, boolean> : {};
        setItems(productos.map((p) => ({ ...p, enabled: parsed.hasOwnProperty(p.codigo) ? !!parsed[p.codigo] : (p.enabled ?? true) })));
      } catch {}
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'product-overrides-map' || e.key === 'product-overrides-updated') onEvent();
    };

    window.addEventListener('product-overrides-changed', onEvent as EventListener);
    window.addEventListener('storage', onStorage as EventListener);
    return () => {
      window.removeEventListener('product-overrides-changed', onEvent as EventListener);
      window.removeEventListener('storage', onStorage as EventListener);
    };
  }, []);

  const toggle = (codigo: string) => {
    setItems((prev) => {
      const prevItem = prev.find((x) => x.codigo === codigo);
      const oldEnabled = prevItem ? !!prevItem.enabled : true;
      const newEnabled = !oldEnabled;
      const next = prev.map((p) => (p.codigo === codigo ? { ...p, enabled: newEnabled } : p));

      // optimistic per-item loading
      setLoadingMap((m) => ({ ...m, [codigo]: true }));
      setLoading(true);

      (async () => {
        try {
          const r = await fetch('/api/admin/product-overrides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo, enabled: newEnabled }) });
          if (!r.ok) throw new Error('failed');

          try {
            const raw = localStorage.getItem('product-overrides-map');
            const parsed = raw ? JSON.parse(raw) as Record<string, boolean> : {};
            parsed[codigo] = newEnabled;
            localStorage.setItem('product-overrides-map', JSON.stringify(parsed));
          } catch {}

          try { localStorage.setItem('product-overrides-updated', String(Date.now())); } catch {}
          // include detail so listeners can update immediately without refetch
          try {
            window.dispatchEvent(new CustomEvent('product-overrides-changed', { detail: { codigo, enabled: newEnabled } }));
          } catch {
            window.dispatchEvent(new Event('product-overrides-changed'));
          }
        } catch (e) {
          // revert optimistic change
          setItems((cur) => cur.map((p) => (p.codigo === codigo ? { ...p, enabled: oldEnabled } : p)));
          alert('Error guardando override');
        } finally {
          setLoadingMap((m) => {
            const copy = { ...m };
            delete copy[codigo];
            return copy;
          });
          setLoading(false);
        }
      })();

      return next;
    });
  };

  // Use the same normalize + tokenization as ListaProductos (página pública)
  const queryNorm = normalize(query).trim();
  const tokens = useMemo(() => queryNorm.split(/\s+/).filter(Boolean), [queryNorm]);

  const filtered = useMemo(() => {
    if (tokens.length === 0) return items;
    const matched = items.filter((p) => matchesTokens(p, tokens));

    // DEBUG: mostrar en consola qué productos coinciden y por qué (temporal)
    try {
      const details = matched.slice(0, 60).map((m) => {
        const nombre = normalize(m.nombre);
        const desc = normalize(m.descripcion ?? "");
        const cod = normalize(m.codigo ?? "");
        return {
          codigo: m.codigo,
          nombre: m.nombre,
          reasons: tokens.map((t) => ({
            token: t,
            inName: nombre.includes(t),
            inDesc: desc.includes(t),
            inCode: cod.includes(t),
          })),
        };
      });
      console.debug('admin-search', { query, tokens, matchedCount: matched.length, details });
    } catch (err) {
      console.debug('admin-search-failed', { err, query, tokens });
    }

    return matched;
  }, [items, tokens]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-300">Habilita o deshabilita productos. Los cambios se aplican inmediatamente para los clientes.</p>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, código o descripción" className="bg-gray-800 placeholder-gray-400 text-sm px-3 py-2 rounded w-72" />
      </div>

      <div className="mt-4 min-h-screen">
        <ListaProductos
          categoriaSeleccionada={null}
          busqueda={query}
          showDisabled={true}
          hideAddButton={true}
          // ListaProductos calls renderExtra(prod, isAvailable)
          renderExtra={(p, isAvailable) => (
            <div className="flex items-center justify-between">
              <div className={`px-3 py-1.5 rounded text-sm font-semibold ${isAvailable ? 'bg-emerald-700 text-white' : 'bg-rose-700 text-white'}`}>{isAvailable ? 'HABILITADO' : 'DESHABILITADO'}</div>
              <button disabled={!!loadingMap[p.codigo]} onClick={() => toggle(p.codigo)} className={`px-3 py-1.5 ${loadingMap[p.codigo] ? 'bg-yellow-500' : 'bg-blue-600 hover:bg-blue-700'} rounded text-sm font-semibold`}>
                {loadingMap[p.codigo] ? (isAvailable ? 'Deshabilitando...' : 'Habilitando...') : (isAvailable ? 'Deshabilitar' : 'Habilitar')}
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
