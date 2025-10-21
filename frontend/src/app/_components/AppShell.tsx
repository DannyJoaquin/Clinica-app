"use client";
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/api';
import ThemeToggle from './ThemeToggle';
import { useProfile } from '@/lib/useProfile';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const { profile } = useProfile();
  // Auth guard global: todo excepto /login requiere token
  useEffect(() => {
    if (pathname !== '/login') {
      const token = getToken();
      if (!token) {
        router.replace('/login');
        setReady(false);
        return;
      }
    }
    setReady(true);
  }, [pathname, router]);
  const hideChrome = pathname === '/login';
  if (hideChrome) return <>{children}</>;
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
      </div>
    );
  }
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <header className="h-14 border-b bg-white dark:bg-gray-900 dark:border-gray-800 flex items-center justify-between px-4">
          <h1 className="text-sm text-gray-600 dark:text-gray-300">Clínica Médica</h1>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="text-right">
                <div className="text-sm text-gray-900 dark:text-gray-100">{profile.nombre}</div>
                <div className="text-xs text-gray-500">{profile.rol}</div>
              </div>
            )}
            <ThemeToggle />
          </div>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
