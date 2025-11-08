"use client";
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Pago, PagoInput, Paciente } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useProfile } from '@/lib/useProfile';

export default function PagosPage() {
  useAuthGuard();
  const toast = useToast();
  const { profile, loading: loadingProfile } = useProfile();
  const [items, setItems] = useState<Pago[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<PagoInput>>({ metodoPago: 'efectivo' });

  const sorted = useMemo(() => items.slice().sort((a, b) => b.id - a.id), [items]);
  const pacientesById = useMemo(() => Object.fromEntries(pacientes.map(p => [p.id, p])), [pacientes]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [pagos, pacs] = await Promise.all([
        apiFetch<Pago[]>('/pagos'),
        apiFetch<Paciente[]>('/pacientes'),
      ]);
      setItems(pagos);
      setPacientes(pacs);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile && (profile.rol === 'admin' || profile.rol === 'asistente')) {
      load();
    }
  }, [profile]);

  function handleChange<K extends keyof PagoInput>(key: K, val: PagoInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function createPago() {
    try {
      setError(null);
      if (!form.pacienteId || !form.monto || !form.metodoPago) {
        setError('Paciente, monto y método de pago son obligatorios');
        return;
      }
      if ((Number(form.monto) || 0) <= 0) {
        setError('El monto debe ser mayor a 0');
        return;
      }
      const payload: any = { ...form, monto: Number(form.monto) };
      const created = await apiFetch<Pago>('/pagos', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setItems((arr) => [created, ...arr]);
      setForm({ metodoPago: 'efectivo' });
      toast.success('Pago registrado');
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || 'Error al registrar pago');
    }
  }

  if (loadingProfile) {
    return (
      <main className="p-6">
        <p className="text-gray-600">Cargando…</p>
      </main>
    );
  }

  if (!(profile?.rol === 'admin' || profile?.rol === 'asistente')) {
    return (
      <main className="p-6">
        <Card>
          <CardHeader>
            <h2 className="font-medium">Pagos</h2>
          </CardHeader>
          <p className="text-gray-600">No tienes permisos para ver esta sección.</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Pagos</h1>

      <Card>
        <CardHeader>
          <h2 className="font-medium">Registrar pago</h2>
          <p className="text-sm text-gray-500">Completa los datos para registrar el pago.</p>
        </CardHeader>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label>Paciente</Label>
            <Select
              value={form.pacienteId || ''}
              onChange={(e) => handleChange('pacienteId', Number(e.target.value) as any)}
            >
              <option value="">Seleccione paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombreCompleto}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>ID Cita (opcional)</Label>
            <Input
              type="number"
              placeholder="ID Cita (opcional)"
              value={form.citaId || ''}
              onChange={(e) => handleChange('citaId', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Monto</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Monto"
              value={form.monto || ''}
              onChange={(e) => handleChange('monto', Number(e.target.value) as any)}
            />
            <p className="text-xs text-gray-500">Usa punto para decimales. Debe ser mayor a 0.</p>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Método de pago</Label>
            <Select
              value={form.metodoPago || 'efectivo'}
              onChange={(e) => handleChange('metodoPago', e.target.value)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </Select>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={createPago}>Registrar</Button>
          <Button variant="outline" onClick={() => setForm({ metodoPago: 'efectivo' })}>Limpiar</Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-medium">Listado</h2>
        </CardHeader>
        {loading ? (
          <p className="text-gray-600">Cargando…</p>
        ) : sorted.length === 0 ? (
          <EmptyState title="Aún no hay pagos" subtitle="Registra el primero con el formulario" />
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50 dark:bg-gray-800/50">
                  <th className="p-2">ID</th>
                  <th className="p-2">Paciente</th>
                  <th className="p-2">Cita</th>
                  <th className="p-2">Monto</th>
                  <th className="p-2">Método</th>
                  <th className="p-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, idx) => (
                  <tr key={p.id} className={"border-b " + (idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/50')}>
                    <td className="p-2">{p.id}</td>
                    <td className="p-2">{pacientesById[p.pacienteId]?.nombreCompleto || p.pacienteId}</td>
                    <td className="p-2">{p.citaId || '-'}</td>
                    <td className="p-2">{'$' + (Number.isFinite(p.monto as any) ? (p.monto as number).toFixed(2) : p.monto)}</td>
                    <td className="p-2">{p.metodoPago}</td>
                    <td className="p-2">{new Date(p.fechaPago).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
