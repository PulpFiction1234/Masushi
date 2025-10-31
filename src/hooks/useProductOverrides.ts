"use client";

import { useEffect, useState } from 'react';

type OverridesMap = Record<string, boolean>;

// Module-level shared cache so multiple mounts don't trigger many fetches
let SHARED_MAP: OverridesMap | null = null;
let FETCH_IN_PROGRESS: Promise<void> | null = null;
let LAST_FETCH_AT = 0;

// Try synchronous localStorage hydrate so many mounts don't trigger network
try {
  const raw = typeof window !== 'undefined' ? localStorage.getItem('product-overrides-map') : null;
  if (raw) {
    SHARED_MAP = JSON.parse(raw) as OverridesMap;
  }
} catch {
  // ignore
}

async function fetchIntoShared() {
  if (FETCH_IN_PROGRESS) return FETCH_IN_PROGRESS;
  FETCH_IN_PROGRESS = (async () => {
    try {
      const res = await fetch('/api/admin/product-overrides');
      if (res.ok) {
        const json = await res.json();
        const raw: Array<Record<string, unknown>> = (json.overrides || json.data || []);
        const next: OverridesMap = {};
        raw.forEach((o) => {
          const codigo = typeof o?.codigo === 'string' ? o.codigo : String(o?.codigo ?? '');
          if (codigo) next[codigo] = !!o?.enabled;
        });
        SHARED_MAP = next;
        return;
      }

      // fallback to localStorage
      try {
        const raw = localStorage.getItem('product-overrides-map');
        const parsed = raw ? JSON.parse(raw) as OverridesMap : {};
        SHARED_MAP = parsed || {};
        return;
      } catch {
        SHARED_MAP = {};
        return;
      }
    } catch {
      try {
        const raw = localStorage.getItem('product-overrides-map');
        const parsed = raw ? JSON.parse(raw) as OverridesMap : {};
        SHARED_MAP = parsed || {};
      } catch {
        SHARED_MAP = {};
      }
    } finally {
      FETCH_IN_PROGRESS = null;
    }
  })();
  return FETCH_IN_PROGRESS;
}

export default function useProductOverrides() {
  const [map, setMap] = useState<OverridesMap>(SHARED_MAP ?? {});
  const [loading, setLoading] = useState<boolean>(SHARED_MAP === null);

  useEffect(() => {
    let mounted = true;

    if (SHARED_MAP === null) {
      setLoading(true);
      fetchIntoShared().then(() => {
        if (!mounted) return;
        setMap(SHARED_MAP ?? {});
        setLoading(false);
      });
    }

    const handler = () => {
      // rate-limit refetches triggered by product-overrides-changed
      const now = Date.now();
      if (now - LAST_FETCH_AT < 1000) return;
      LAST_FETCH_AT = now;
      // refetch when overrides change (admin panel dispatches this event)
      setLoading(true);
      fetchIntoShared().then(() => {
        if (!mounted) return;
        setMap(SHARED_MAP ?? {});
        setLoading(false);
      });
    };

    window.addEventListener('product-overrides-changed', handler as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener('product-overrides-changed', handler as EventListener);
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    await fetchIntoShared();
    setMap(SHARED_MAP ?? {});
    setLoading(false);
  };

  return { map, loading, refresh } as const;
}
