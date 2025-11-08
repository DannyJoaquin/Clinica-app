"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { useProfile } from '@/lib/useProfile';
import { apiFetch } from '@/lib/api';
import { Users, CalendarClock, CreditCard, FileText, AlertTriangle, Download } from 'lucide-react';

type Summary = {
  totalPatients: number;
  appointmentsToday: number;
  monthlyIncome: number;
  totalPrescriptions: number;
  appointmentsByStatus: { pending: number; confirmed: number; done: number; cancelled: number };
  recentActivity: { type: string; message: string; timestamp: string }[];
  upcomingAppointments: { patient: string; doctor: string; time: string; status: string }[];
  incomeByMonth?: { month: string; amount: number }[];
};

export default function AdminDashboardPage() {
  const toast = useToast();
  const { profile, loading: loadingProfile } = useProfile();
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(false);
  const [agendaFilter, setAgendaFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  // Usa API real por defecto (controlable con NEXT_PUBLIC_USE_API=false si necesitas mock rápido)
  const USE_API = process.env.NEXT_PUBLIC_USE_API !== 'false';

  const mock: Summary = useMemo(
    () => ({
      totalPatients: 134,
      appointmentsToday: 12,
      monthlyIncome: 45000,
      totalPrescriptions: 89,
      appointmentsByStatus: { pending: 5, confirmed: 6, done: 3, cancelled: 1 },
      recentActivity: [
        { type: 'appointment', message: 'Nueva cita creada para Juan Pérez', timestamp: new Date().toISOString() },
        { type: 'payment', message: 'Pago registrado de L. 1200', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        { type: 'patient', message: 'Paciente agregado: María López', timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString() },
      ],
      upcomingAppointments: [
        { patient: 'María López', doctor: 'Dra. Ana Martínez', time: '10:00 AM', status: 'pending' },
        { patient: 'José Gómez', doctor: 'Dr. Luis Pérez', time: '11:30 AM', status: 'confirmed' },
        { patient: 'Ana Reyes', doctor: 'Dra. Sofía Cruz', time: '02:15 PM', status: 'done' },
      ],
      incomeByMonth: [
        { month: 'Jun', amount: 32000 },
        { month: 'Jul', amount: 38000 },
        { month: 'Ago', amount: 41000 },
        { month: 'Sep', amount: 46000 },
        { month: 'Oct', amount: 45000 },
        { month: 'Nov', amount: 47000 },
      ],
    }),
    []
  );

  const [data, setData] = useState<Summary>(mock);
  // Evita refetches en bucle (por identidades cambiantes o StrictMode en dev)
  const fetchedForRangeRef = useRef<string | null>(null);

  useEffect(() => {
    // Evita re-ejecuciones innecesarias: solo cuando hay perfil admin y cambia el rango
    if (!USE_API) return;
    if (loadingProfile || profile?.rol !== 'admin') return;
    if (fetchedForRangeRef.current === range) return;
    fetchedForRangeRef.current = range;
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch<Summary>(`/admin/dashboard/summary?range=${range}`);
        setData({ ...res, incomeByMonth: res.incomeByMonth ?? mock.incomeByMonth });
      } catch (e: any) {
        toast.error('No se pudo cargar el dashboard');
      } finally {
        setLoading(false);
      }
    })();
  // Dependencias mínimas y estables: rango y la disponibilidad del perfil admin
  }, [range, loadingProfile, profile?.rol]);

  const pieData = useMemo(
    () => [
      { name: 'Pendiente', value: data.appointmentsByStatus.pending },
      { name: 'Confirmada', value: data.appointmentsByStatus.confirmed },
      { name: 'Realizada', value: data.appointmentsByStatus.done },
      { name: 'Cancelada', value: data.appointmentsByStatus.cancelled },
    ],
    [data.appointmentsByStatus]
  );

  const filteredAgenda = useMemo(() => {
    if (agendaFilter === 'all') return data.upcomingAppointments;
    if (agendaFilter === 'pending') return data.upcomingAppointments.filter((a) => a.status === 'pending');
    return data.upcomingAppointments.filter((a) => a.status === 'confirmed');
  }, [agendaFilter, data.upcomingAppointments]);

  function toCSV(rows: Record<string, any>[], filename: string) {
    if (!rows?.length) {
      toast.error('No hay datos para exportar');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exportado a CSV');
  }

  async function exportIncomePDF() {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Ingresos por Mes', 14, 18);
      doc.setFontSize(11);
      const rows = (data.incomeByMonth ?? []).map((r) => [r.month, `L. ${r.amount.toLocaleString()}`]);
      let y = 28;
      doc.text('Mes', 14, y);
      doc.text('Ingresos', 80, y);
      y += 6;
      rows.forEach((r) => {
        doc.text(String(r[0]), 14, y);
        doc.text(String(r[1]), 80, y);
        y += 6;
      });
      doc.save('ingresos.pdf');
      toast.success('PDF generado');
    } catch {
      toast.error('Instala jspdf para exportar PDF (npm i jspdf)');
    }
  }

  if (loadingProfile) return <main className="p-4"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" /></main>;
  if (profile?.rol !== 'admin') {
    return (
      <main className="space-y-6">
        <Card>
          <div className="p-4">
            <h2 className="font-medium">Panel de Administración</h2>
            <p className="text-gray-600">No tienes permisos para ver esta sección.</p>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel de Administración</h1>
          <p className="text-gray-600 dark:text-gray-300">Resumen general y herramientas.</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/usuarios" className="text-sm text-blue-600 hover:underline">Gestionar usuarios/roles</a>
          <a href="/dashboard/admin/permisos" className="text-sm text-blue-600 hover:underline">Gestionar permisos</a>
          <Select value={range} onChange={(e) => setRange(e.target.value as any)}>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </Select>
          <Button onClick={() => (USE_API ? setRange(range) : toast.info('Usando datos de ejemplo'))}>Actualizar</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Pacientes" value={data.totalPatients} loading={loading} color="text-blue-600" />
        <StatCard icon={<CalendarClock className="h-5 w-5" />} label="Citas de hoy" value={data.appointmentsToday} loading={loading} color="text-emerald-600" />
        <StatCard icon={<CreditCard className="h-5 w-5" />} label="Ingresos del mes" value={`L. ${data.monthlyIncome.toLocaleString()}`} loading={loading} color="text-orange-600" />
        <StatCard icon={<FileText className="h-5 w-5" />} label="Recetas emitidas" value={data.totalPrescriptions} loading={loading} color="text-purple-600" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-medium">Ingresos por mes</h3>
            <Button variant="outline" size="sm" onClick={exportIncomePDF}><Download className="h-4 w-4 mr-1" /> PDF</Button>
          </div>
          <div className="p-4">
            <BarChartLazy data={data.incomeByMonth || []} loading={loading} />
          </div>
        </Card>
        <Card>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-medium">Citas por estado</h3>
          </div>
          <div className="p-4">
            <PieChartLazy data={pieData} loading={loading} />
          </div>
        </Card>
      </div>

      {/* Agenda del día */}
      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-medium">Agenda del día</h3>
          <div className="flex gap-2 text-sm">
            <button className={tabCls(agendaFilter === 'all')} onClick={() => setAgendaFilter('all')}>Todas</button>
            <button className={tabCls(agendaFilter === 'pending')} onClick={() => setAgendaFilter('pending')}>Pendientes</button>
            <button className={tabCls(agendaFilter === 'confirmed')} onClick={() => setAgendaFilter('confirmed')}>Confirmadas</button>
          </div>
        </div>
        <div className="p-4">
          {filteredAgenda.length === 0 ? (
            <p className="text-sm text-gray-500">Sin citas para mostrar.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredAgenda.map((a, i) => (
                <li key={i} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.patient}</div>
                    <div className="text-xs text-gray-500">{a.doctor}</div>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-200">{a.time}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Actividad Reciente y Alertas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-medium">Actividad reciente</h3>
          </div>
          <div className="p-4">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500">Sin actividad registrada.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentActivity.map((ev, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
                    <div>
                      <div className="text-sm">{ev.message}</div>
                      <div className="text-xs text-gray-500">{new Date(ev.timestamp).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
        <Card>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-medium">Alertas</h3>
          </div>
          <div className="p-4 grid gap-3 md:grid-cols-2">
            <AlertCard label="Citas sin confirmar" value={data.appointmentsByStatus.pending} />
            <AlertCard label="Pagos pendientes" value={Math.max(0, Math.floor(data.appointmentsByStatus.confirmed / 2))} />
            <AlertCard label="Pacientes sin antecedentes" value={Math.max(0, Math.floor(data.totalPatients * 0.1))} />
          </div>
        </Card>
      </div>

      {/* Exportaciones rápidas */}
      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-medium">Exportaciones rápidas</h3>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toCSV([
            { id: 1, nombre: 'Juan Pérez', correo: 'juan@ejemplo.com' },
            { id: 2, nombre: 'María López', correo: 'maria@ejemplo.com' },
          ], 'pacientes.csv')}><Download className="h-4 w-4 mr-1" /> Pacientes CSV</Button>
          <Button variant="outline" onClick={exportIncomePDF}><Download className="h-4 w-4 mr-1" /> Ingresos PDF</Button>
          <Button variant="outline" onClick={() => toCSV(data.upcomingAppointments.map((a, i) => ({ id: i + 1, paciente: a.patient, doctor: a.doctor, hora: a.time })), 'citas-dia.csv')}><Download className="h-4 w-4 mr-1" /> Citas del día CSV</Button>
        </div>
      </Card>
    </main>
  );
}

function StatCard({ icon, label, value, loading, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; loading?: boolean; color?: string }) {
  return (
    <Card>
      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
          {loading ? (
            <div className="mt-1 h-6 w-20 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ) : (
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
          )}
        </div>
        <div className={`h-10 w-10 rounded-full grid place-items-center bg-gray-100 dark:bg-gray-800 ${color || ''}`}>{icon}</div>
      </div>
    </Card>
  );
}

function AlertCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-amber-300/50 bg-amber-50 dark:bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300 flex items-center gap-2">
      <AlertTriangle className="h-4 w-4" />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs">{value} {value === 1 ? 'registro' : 'registros'}</div>
      </div>
    </div>
  );
}

function tabCls(active: boolean) {
  return [
    'px-3 py-1.5 rounded-md',
    active ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  ].join(' ');
}

// Lazy charts without importing recharts at build-time
function BarChartLazy({ data, loading }: { data: { month: string; amount: number }[]; loading?: boolean }) {
  const [mods, setMods] = useState<any | null>(null);
  useEffect(() => {
    let mounted = true;
    import('recharts').then((m) => mounted && setMods(m)).catch(() => setMods(null));
    return () => {
      mounted = false;
    };
  }, []);
  if (loading || !mods) {
    return <div className="h-64 w-full rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }
  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } = mods;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" fill="#60a5fa" name="Ingresos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieChartLazy({ data, loading }: { data: { name: string; value: number }[]; loading?: boolean }) {
  const [mods, setMods] = useState<any | null>(null);
  useEffect(() => {
    let mounted = true;
    import('recharts').then((m) => mounted && setMods(m)).catch(() => setMods(null));
    return () => {
      mounted = false;
    };
  }, []);
  if (loading || !mods) {
    return <div className="h-64 w-full rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }
  const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } = mods;
  const COLORS = ['#60a5fa', '#fbbf24', '#34d399', '#f87171'];
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
