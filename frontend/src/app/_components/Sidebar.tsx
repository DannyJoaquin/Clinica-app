"use client";
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, ReceiptText, CreditCard, LogOut, Stethoscope } from 'lucide-react';
import { useCallback } from 'react';
import { useProfile } from '@/lib/useProfile';
import { usePermissions } from '@/lib/usePermissions';

type NavItem = {
  href: Route;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin', label: 'Admin', icon: LayoutDashboard },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/citas', label: 'Citas', icon: Calendar },
  { href: '/dashboard/preclinica/nueva', label: 'Preclínica', icon: Stethoscope },
  { href: '/recetas', label: 'Recetas', icon: ReceiptText },
  { href: '/pagos', label: 'Pagos', icon: CreditCard },
  { href: '/usuarios', label: 'Usuarios', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfile();
  const { can } = usePermissions();

  const onLogout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      router.push('/login');
    } catch {}
  }, [router]);

  return (
    <aside className="h-screen w-60 bg-white dark:bg-gray-900 border-r dark:border-gray-800 shadow-sm flex flex-col">
      <div className="px-4 py-5 border-b">
        <Link href="/" className="block">
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Clínica</span>
        </Link>
        <p className="text-xs text-gray-500">Sistema de gestión</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {NAV.filter((item) => {
          if (item.href === '/pagos') {
            return profile?.rol === 'admin' || profile?.rol === 'asistente';
          }
          if (item.href === '/usuarios') return profile?.rol === 'admin';
          if (item.href === '/dashboard/admin') return profile?.rol === 'admin';
          if (item.href === '/dashboard/preclinica/nueva') return can('preclinic.upsert');
          if (item.href === '/citas') return can('citas.view');
          return true;
        }).map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t">
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md px-3 py-2 text-sm">
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
