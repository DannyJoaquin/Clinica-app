"use client";
import { useEffect } from 'react';
import { getToken } from './api';
import { useRouter } from 'next/navigation';

export function useAuthGuard() {
  const router = useRouter();
  useEffect(() => {
    const token = getToken();
    if (!token) router.replace('/login');
  }, [router]);
}
