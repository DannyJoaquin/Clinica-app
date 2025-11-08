"use client";
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api';
import { useProfile } from './useProfile';

export function usePermissions() {
  const { profile, loading: loadingProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    if (loadingProfile) return;
    if (!profile) {
      setKeys([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const list = await apiFetch<string[]>(`/auth/permissions`);
        if (!cancelled) setKeys(list || []);
      } catch {
        if (!cancelled) setKeys([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadingProfile, profile?.id, profile?.rol]);

  const set = useMemo(() => new Set(keys), [keys]);
  const can = (perm: string | string[]) => {
    if (Array.isArray(perm)) return perm.every((p) => set.has(p));
    return set.has(perm);
  };

  return { loading, permissions: keys, can } as const;
}
