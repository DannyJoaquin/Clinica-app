"use client";
import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { Users, CalendarCheck, FileText, CreditCard, Plus, Stethoscope } from 'lucide-react';
import type { Paciente, Cita } from '@/lib/types';

type Count = { pacientes: number; citas: number; recetas: number; pagos: number };

export default function DashboardPage() {
  useAuthGuard();
  const [count, setCount] = useState<Count | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);

  const latestPacientes = useMemo(() => pacientes.slice().sort((a, b) => b.id - a.id).slice(0, 5), [pacientes]);
  const latestCitas = useMemo(() => citas.slice().sort((a, b) => b.id - a.id).slice(0, 5), [citas]);

  useEffect(() => {
    (async () => {
      try {
        const [p, c, g, r] = await Promise.all([
          apiFetch<Paciente[]>('/pacientes'),
          apiFetch<Cita[]>('/citas'),
          apiFetch<any[]>('/pagos').catch(() => []),
          apiFetch<any[]>('/recetas').catch(() => []),
        ]);
        setPacientes(p);
        setCitas(c);
        setCount({ pacientes: p.length, citas: c.length, recetas: r.length, pagos: g.length });
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <main className="space-y-6">
      {/* Hero */}
      <div className="rounded-xl p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow">
        <h1 className="text-2xl font-semibold">Bienvenido</h1>
        <p className="text-white/90">Resumen general y accesos rápidos de la clínica.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <QuickAction href="/pacientes" label="Nuevo paciente" Icon={Users} />
          <QuickAction href="/citas" label="Nueva cita" Icon={CalendarCheck} />
          <QuickAction href="/recetas" label="Nueva receta" Icon={FileText} />
          <QuickAction href="/pagos" label="Registrar pago" Icon={CreditCard} />
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pacientes" value={count?.pacientes ?? '—'} href="/pacientes" Icon={Users} color="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
        <StatCard label="Citas" value={count?.citas ?? '—'} href="/citas" Icon={CalendarCheck} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Recetas" value={count?.recetas ?? '—'} href="/recetas" Icon={FileText} color="bg-purple-500/10 text-purple-600 dark:text-purple-400" />
        <StatCard label="Pagos" value={count?.pagos ?? '—'} href="/pagos" Icon={CreditCard} color="bg-orange-500/10 text-orange-600 dark:text-orange-400" />
      </div>

      {/* Recent lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentCard title="Pacientes recientes" items={latestPacientes.map(p => ({ id: p.id, primary: p.nombreCompleto, secondary: p.correo || p.telefono || '—' }))} empty="Aún no hay pacientes" hrefAll="/pacientes" />
        <RecentCard title="Citas recientes" items={latestCitas.map(c => ({ id: c.id, primary: `Cita #${c.id}`, secondary: `${new Date(c.fecha).toLocaleDateString()} · ${c.hora}` }))} empty="Aún no hay citas" hrefAll="/citas" />
      </div>
    </main>
  );
}

function StatCard({ label, value, href, Icon, color }: { label: string; value: number | string; href: Route; Icon: any; color: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
        </div>
        <div className={`h-10 w-10 rounded-full grid place-items-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

function QuickAction({ href, label, Icon }: { href: Route; label: string; Icon: any }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-md bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 text-sm transition">
      <Plus className="h-4 w-4" />
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function RecentCard({ title, items, empty, hrefAll }: { title: string; items: { id: number; primary: string; secondary?: string }[]; empty: string; hrefAll: Route }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <Link href={hrefAll} className="text-sm text-blue-600 hover:underline">Ver todo</Link>
      </div>
      {items.length === 0 ? (
        <div className="p-4 text-sm text-gray-600 dark:text-gray-400">{empty}</div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {items.map(it => (
            <li key={it.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{it.primary}</div>
                {it.secondary && <div className="text-xs text-gray-500 dark:text-gray-400">{it.secondary}</div>}
              </div>
              <Stethoscope className="h-4 w-4 text-gray-400" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
