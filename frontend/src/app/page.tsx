import Link from 'next/link';
import type { Route } from 'next';
import { Users, Calendar, ReceiptText, CreditCard } from 'lucide-react';

const cards: { href: Route; title: string; desc: string; Icon: any }[] = [
  { href: '/pacientes', title: 'Pacientes', desc: 'Alta, edición y listado', Icon: Users },
  { href: '/citas', title: 'Citas', desc: 'Agendar y gestionar citas', Icon: Calendar },
  { href: '/recetas', title: 'Recetas', desc: 'Emitir y descargar PDF', Icon: ReceiptText },
  { href: '/pagos', title: 'Pagos', desc: 'Registrar cobros', Icon: CreditCard },
];

export default function HomePage() {
  return (
    <main className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-gray-900">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-blue-200/40 blur-2xl dark:bg-blue-500/10" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-indigo-200/40 blur-2xl dark:bg-indigo-500/10" />
        <div className="relative p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Sistema de Gestión Clínica
          </h1>
          <p className="mt-2 max-w-2xl text-sm md:text-base text-gray-700 dark:text-gray-300">
            Administra pacientes, citas, recetas y pagos en un solo lugar. Rápido, seguro y con modo oscuro.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/pacientes" className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors">
              Ir a Pacientes
            </Link>
            <Link href="/citas" className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 bg-white/80 dark:bg-gray-900/60 hover:bg-white dark:hover:bg-gray-900 transition-colors">
              Ver Citas
            </Link>
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Accesos rápidos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ href, title, desc, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{title}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
