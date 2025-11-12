import { useCallback } from 'react';
import useSWR from 'swr';

export type AdminMode = 'normal' | 'forceOpen' | 'forceClosed';

const DEFAULT_MODE: AdminMode = 'normal';

const isAdminMode = (value: unknown): value is AdminMode =>
  value === 'normal' || value === 'forceOpen' || value === 'forceClosed';

async function fetchAdminMode(url: string): Promise<AdminMode> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return DEFAULT_MODE;
    }
    const json = await response.json();
    const rawMode = json?.mode;
    return isAdminMode(rawMode) ? rawMode : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function useAdminMode() {
  const { data, error, isLoading, mutate } = useSWR<AdminMode>(
    '/api/admin/mode',
    fetchAdminMode,
    {
      dedupingInterval: 10_000,
      revalidateOnFocus: false,
    },
  );

  const setMode = useCallback(
    async (next: AdminMode) => {
      try {
        await mutate(
          async () => {
            const response = await fetch('/api/admin/mode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode: next }),
            });
            if (!response.ok) {
              throw new Error('Failed to persist admin mode');
            }
            const json = await response.json();
            const serverMode = json?.mode;
            return isAdminMode(serverMode) ? serverMode : DEFAULT_MODE;
          },
          {
            optimisticData: next,
            rollbackOnError: true,
            revalidate: false,
          },
        );

        try {
          localStorage.setItem('admin-mode-updated', String(Date.now()));
        } catch {
          // ignore storage errors (private browsing, etc.)
        }
        try {
          window.dispatchEvent(new Event('admin-mode-changed'));
        } catch {
          // dispatch may fail in non-browser environments
        }
      } catch (error) {
        throw error;
      }
    },
    [mutate],
  );

  const refresh = useCallback(() => {
    void mutate();
  }, [mutate]);

  return {
    mode: data ?? DEFAULT_MODE,
    loading: isLoading && !data,
    error,
    setMode,
    refresh,
  };
}
