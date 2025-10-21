"use client";
import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthGuard } from '@/lib/useAuthGuard';

type Count = { pacientes: number; citas: number; recetas: number; pagos: number };

export default function DashboardPage() {
  useAuthGuard();
  const [count, setCount] = useState<Count | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, c, g] = await Promise.all([
          apiFetch<any[]>('/pacientes'),
          apiFetch<any[]>('/citas'),
          apiFetch<any[]>('/pagos').catch(() => []),
        ]);
        setCount({ pacientes: p.length, citas: c.length, recetas: 0, pagos: g.length });
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Resumen del sistema</p>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pacientes" value={count?.pacientes ?? '—'} href="/pacientes" />
        <StatCard label="Citas" value={count?.citas ?? '—'} href="/citas" />
        <StatCard label="Pagos" value={count?.pagos ?? '—'} href="/pagos" />
        <StatCard label="Recetas" value="—" href="/recetas" />
      </div>
    </main>
  );
}

function StatCard({ label, value, href }: { label: string; value: number | string; href: Route }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:shadow-sm transition-all"
    >
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
    </Link>
  );
}
