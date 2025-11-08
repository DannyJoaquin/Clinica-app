"use client";
import { useEffect, useState } from 'react';
import { apiFetch, getToken } from './api';
import type { UsuarioProfile } from './types';

export function useProfile() {
  const [profile, setProfile] = useState<UsuarioProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const token = getToken();
    if (!token) {
      // Evita llamadas innecesarias y errores cuando no hay token aún
      setLoading(false);
      return () => { mounted = false; };
    }
    (async () => {
      try {
        const me = await apiFetch<UsuarioProfile>('/auth/profile');
        if (mounted) setProfile(me);
      } catch (e: any) {
        if (mounted) setError(e.message || 'No autorizado');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { profile, loading, error };
}
