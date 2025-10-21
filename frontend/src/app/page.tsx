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
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clínica Médica</h1>
        <p className="text-gray-600 dark:text-gray-300">Elige una sección o usa los accesos rápidos.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ href, title, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:shadow transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium">{title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
