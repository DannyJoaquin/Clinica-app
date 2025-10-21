"use client";
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Cita, CitaInput, Paciente, Doctor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/lib/useProfile';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function CitasPage() {
  useAuthGuard();
  const toast = useToast();
  const { profile } = useProfile();
  const [items, setItems] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CitaInput>>({ estado: 'pendiente' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const sorted = useMemo(() => items.slice().sort((a, b) => b.id - a.id), [items]);
  const pacientesById = useMemo(() => Object.fromEntries(pacientes.map(p => [p.id, p])), [pacientes]);
  const doctoresById = useMemo(() => Object.fromEntries(doctores.map(d => [d.id, d])), [doctores]);
  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter((c) =>
      String(c.id).includes(q) ||
      (pacientesById[c.pacienteId]?.nombreCompleto || '').toLowerCase().includes(q)
    );
  }, [filter, sorted, pacientesById]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [citas, pacs, docs] = await Promise.all([
        apiFetch<Cita[]>('/citas'),
        apiFetch<Paciente[]>('/pacientes'),
        apiFetch<Doctor[]>('/doctores'),
      ]);
      setItems(citas);
      setPacientes(pacs);
      setDoctores(docs);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange<K extends keyof CitaInput>(key: K, val: CitaInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function save() {
    try {
      setError(null);
      setSaving(true);
      if (!form.pacienteId || !form.doctorId || !form.fecha || !form.hora) {
        setError('Paciente, doctor, fecha y hora son obligatorios');
        return;
      }
      const payload: any = { ...form };
      // asegurar fecha en ISO si viene como yyyy-mm-dd
      if (typeof payload.fecha === 'string' && payload.fecha.length === 10) {
        payload.fecha = new Date(`${payload.fecha}T${form.hora || '00:00'}:00`).toISOString();
      }
      if (editingId) {
        const updated = await apiFetch<Cita>(`/citas/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setItems((arr) => arr.map((c) => (c.id === editingId ? updated : c)));
        setEditingId(null);
        toast.success('Cita actualizada');
      } else {
        const created = await apiFetch<Cita>('/citas', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setItems((arr) => [created, ...arr]);
        toast.success('Cita creada');
      }
      setForm({ estado: 'pendiente' });
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function edit(c: Cita) {
    setEditingId(c.id);
    const d = new Date(c.fecha);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setForm({
      pacienteId: c.pacienteId,
      doctorId: c.doctorId,
      fecha: `${yyyy}-${mm}-${dd}`,
      hora: c.hora,
      motivoConsulta: c.motivoConsulta || undefined,
      estado: c.estado,
      notas: c.notas || undefined,
    });
  }

  async function remove(id: number) {
    try {
      if (!(profile?.rol === 'admin' || profile?.rol === 'asistente')) {
        setError('No tienes permisos para eliminar');
        toast.error('No tienes permisos para eliminar');
        return;
      }
      setPendingDeleteId(id);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || 'Error al eliminar');
    }
  }

  async function performDelete(id: number) {
    try {
      await apiFetch(`/citas/${id}`, { method: 'DELETE' });
      setItems((arr) => arr.filter((c) => c.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm({ estado: 'pendiente' });
      }
      toast.success('Cita eliminada');
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || 'Error al eliminar');
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <>
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Citas</h1>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-medium">{editingId ? 'Editar cita' : 'Crear cita'}</h2>
          {error && <p className="text-red-600 mt-1">{error}</p>}
        </CardHeader>

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
            <Label>Doctor</Label>
            <Select
              value={form.doctorId || ''}
              onChange={(e) => handleChange('doctorId', Number(e.target.value) as any)}
            >
              <option value="">Seleccione doctor</option>
              {doctores.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Fecha</Label>
            <Input
              type="date"
              placeholder="Fecha"
              value={typeof form.fecha === 'string' ? (form.fecha as string).slice(0, 10) : ''}
              onChange={(e) => handleChange('fecha', e.target.value as any)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Hora</Label>
            <Input
              type="time"
              placeholder="Hora"
              value={form.hora || ''}
              onChange={(e) => handleChange('hora', e.target.value as any)}
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <Label>Motivo de consulta</Label>
            <Input
              placeholder="Motivo de consulta"
              value={form.motivoConsulta || ''}
              onChange={(e) => handleChange('motivoConsulta', e.target.value as any)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Estado</Label>
            <Select
              value={form.estado || 'pendiente'}
              onChange={(e) => handleChange('estado', e.target.value as any)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Notas</Label>
            <Input
              placeholder="Notas"
              value={form.notas || ''}
              onChange={(e) => handleChange('notas', e.target.value as any)}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button onClick={save} loading={saving}>
            {editingId ? 'Guardar cambios' : 'Crear'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingId(null);
              setForm({ estado: 'pendiente' });
            }}
          >
            Limpiar
          </Button>
          {editingId && (
            <Button
              onClick={() => {
                setEditingId(null);
                setForm({ estado: 'pendiente' });
              }}
              variant="outline"
            >
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-medium">Listado</h2>
          <Input
            placeholder="Buscar por ID o paciente"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </CardHeader>
        {loading ? (
          <p className="text-gray-600">Cargando…</p>
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin resultados" subtitle="Intenta ajustar el filtro o crea una nueva cita" />
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50 dark:bg-gray-800/50">
                  <th className="p-2">ID</th>
                  <th className="p-2">Paciente</th>
                  <th className="p-2">Doctor</th>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Hora</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: Cita, idx) => (
                  <tr key={c.id} className={"border-b " + (idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/50')}>
                    <td className="p-2">{c.id}</td>
                    <td className="p-2">{pacientesById[c.pacienteId]?.nombreCompleto || c.pacienteId}</td>
                    <td className="p-2">{doctoresById[c.doctorId]?.nombre || c.doctorId}</td>
                    <td className="p-2">{new Date(c.fecha).toLocaleDateString()}</td>
                    <td className="p-2">{c.hora}</td>
                    <td className="p-2">
                      <Badge variant={c.estado === 'confirmada' ? 'success' : c.estado === 'cancelada' ? 'destructive' : c.estado === 'realizada' ? 'info' : 'default'}>
                        {c.estado}
                      </Badge>
                    </td>
                    <td className="p-2 flex gap-2">
                      <button className="text-blue-600 hover:underline" onClick={() => edit(c)}>
                        Editar
                      </button>
                      <button className="text-red-600 hover:underline disabled:text-gray-400" onClick={() => remove(c.id)} disabled={!(profile?.rol === 'admin' || profile?.rol === 'asistente')}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
    <ConfirmDialog
      open={pendingDeleteId !== null}
      title="Eliminar cita"
      description="Esta acción no se puede deshacer. ¿Deseas continuar?"
      confirmLabel="Eliminar"
      onCancel={() => setPendingDeleteId(null)}
      onConfirm={() => pendingDeleteId !== null && performDelete(pendingDeleteId)}
    />
  </>
  );
}

