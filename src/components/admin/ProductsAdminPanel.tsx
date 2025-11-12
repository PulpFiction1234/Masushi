"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { productos, type Producto } from "@/data/productos";
import { normalize } from "@/utils/strings";

type AdminProducto = Producto & { enabled?: boolean };

type RawOverride = {
  codigo?: unknown;
  enabled?: unknown;
};

const DEFAULT_ENABLED_MAP: Record<string, boolean> = productos.reduce((acc, producto) => {
  const clave = typeof producto.codigo === 'string' ? producto.codigo : String(producto.codigo ?? '');
  if (!clave) return acc;
  const enabled = (producto as AdminProducto).enabled;
  acc[clave] = enabled === undefined ? true : Boolean(enabled);
  return acc;
}, {} as Record<string, boolean>);

const parseOverrideArray = (raw: unknown): RawOverride[] => {
  if (!Array.isArray(raw)) return [];
  return raw as RawOverride[];
};

const productOverridesFetcher = async (url: string): Promise<Record<string, boolean>> => {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return {};
    }
    const json = await response.json();
    const collection = parseOverrideArray(json?.overrides ?? json?.data);
    return collection.reduce<Record<string, boolean>>((map, entry) => {
      const code = typeof entry?.codigo === 'string' ? entry.codigo : String(entry?.codigo ?? '');
      if (!code) return map;
      map[code] = Boolean(entry?.enabled);
      return map;
    }, {});
  } catch {
    return {};
  }
};

export default function ProductsAdminPanel() {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  const { data: overrideMapData, isLoading: overridesLoading, mutate } = useSWR<Record<string, boolean>>(
    '/api/admin/product-overrides',
    productOverridesFetcher,
    {
      dedupingInterval: 10_000,
      fallbackData: {},
      revalidateOnFocus: false,
    },
  );

  const overrideMap = overrideMapData ?? {};

  const items = useMemo<AdminProducto[]>(() => {
    return productos.map((producto: Producto) => {
      const codigo = typeof producto.codigo === 'string' ? producto.codigo : String(producto.codigo ?? '');
      const defaultEnabled = DEFAULT_ENABLED_MAP[codigo] ?? true;
      const hasOverride = Object.prototype.hasOwnProperty.call(overrideMap, codigo);
      const enabled = hasOverride ? Boolean(overrideMap[codigo]) : defaultEnabled;
      return { ...(producto as AdminProducto), enabled };
    });
  }, [overrideMap]);

  const getEffectiveEnabled = (codigo: string) => {
    if (Object.prototype.hasOwnProperty.call(overrideMap, codigo)) {
      return Boolean(overrideMap[codigo]);
    }
    return DEFAULT_ENABLED_MAP[codigo] ?? true;
  };

  const persistLocalOverride = (codigo: string, enabled: boolean) => {
    try {
      const raw = localStorage.getItem('product-overrides-map');
      const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      parsed[codigo] = enabled;
      localStorage.setItem('product-overrides-map', JSON.stringify(parsed));
    } catch {
      // ignore storage errors
    }
    try {
      localStorage.setItem('product-overrides-updated', String(Date.now()));
    } catch {
      // ignore storage errors
    }
    try {
      window.dispatchEvent(new CustomEvent('product-overrides-changed', { detail: { codigo, enabled } }));
    } catch {
      window.dispatchEvent(new Event('product-overrides-changed'));
    }
  };

  const toggle = (codigo: string) => {
    const previousEnabled = getEffectiveEnabled(codigo);
    const nextEnabled = !previousEnabled;

    setLoadingMap((m) => ({ ...m, [codigo]: true }));
    persistLocalOverride(codigo, nextEnabled);

    mutate(
      async (current) => {
        const response = await fetch('/api/admin/product-overrides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo, enabled: nextEnabled }),
        });
        if (!response.ok) {
          throw new Error('Failed to persist override');
        }
        const nextMap = { ...(current ?? {}) };
        nextMap[codigo] = nextEnabled;
        return nextMap;
      },
      {
        optimisticData: { ...(overrideMap ?? {}), [codigo]: nextEnabled },
        rollbackOnError: true,
        revalidate: false,
        populateCache: true,
      },
    ).catch(() => {
      persistLocalOverride(codigo, previousEnabled);
      alert('Error guardando override en el servidor (si el servidor está configurado). Cambio revertido.');
    }).finally(() => {
      setLoadingMap((m) => {
        const copy = { ...m };
        delete copy[codigo];
        return copy;
      });
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
        <p className="text-xs md:text-sm text-gray-300">
          {overridesLoading ? 'Cargando overrides...' : 'Habilita o deshabilita productos. Los cambios se aplican inmediatamente para los clientes.'}
        </p>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar..." className="bg-gray-800 placeholder-gray-400 text-xs md:text-sm px-3 py-2 rounded w-full sm:w-64 md:w-72" />
      </div>

      <div className="mt-4">
        <div className="grid gap-3">
          {filtered.map((p) => {
            const codigoKey = typeof p.codigo === 'string' ? p.codigo : String(p.codigo ?? '');
            return (
            <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-800 p-3 rounded gap-3">
              <div className="flex-1">
                <div className="text-xs md:text-sm font-semibold">{p.nombre} <span className="text-xs text-gray-400">{p.codigo}</span></div>
                <div className="text-xs text-gray-400 break-words">{p.descripcion}</div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-semibold flex-1 sm:flex-none text-center ${p.enabled ? 'bg-emerald-700 text-white' : 'bg-rose-700 text-white'}`}>{p.enabled ? 'HABILITADO' : 'DESHABILITADO'}</div>
                <button disabled={!!loadingMap[codigoKey]} onClick={() => toggle(codigoKey)} className={`px-2 md:px-3 py-1 ${loadingMap[codigoKey] ? 'bg-yellow-500' : 'bg-blue-600 hover:bg-blue-700'} rounded text-xs md:text-sm font-semibold flex-1 sm:flex-none whitespace-nowrap`}>
                  {loadingMap[codigoKey] ? (p.enabled ? 'Deshabilitando...' : 'Habilitando...') : (p.enabled ? 'Deshabilitar' : 'Habilitar')}
                </button>
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}
