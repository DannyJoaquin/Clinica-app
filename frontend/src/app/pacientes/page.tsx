"use client";
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Paciente, PacienteInput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { useProfile } from '@/lib/useProfile';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function PacientesPage() {
  useAuthGuard();
  const { profile } = useProfile();
  const toast = useToast();
  const [items, setItems] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<PacienteInput>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<{ telefono?: string; correo?: string; nombre?: string; fechaNacimiento?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const sorted = useMemo(() => items.slice().sort((a, b) => b.id - a.id), [items]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Paciente[]>('/pacientes');
      setItems(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange<K extends keyof PacienteInput>(key: K, val: PacienteInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function validate(): boolean {
    const errs: typeof formErrors = {};
    if (!form.nombreCompleto) errs.nombre = 'El nombre es obligatorio';
    if (!form.fechaNacimiento) errs.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
    const tel = (form.telefono || '').replace(/\D/g, '');
    if (form.telefono && tel.length !== 8) errs.telefono = 'El teléfono de Honduras debe tener 8 dígitos';
    if (form.correo) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.correo)) errs.correo = 'Correo inválido';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save() {
    try {
      setError(null);
      setSubmitted(true);
      if (!validate()) return;
      // Roles: create/update permitidos para admin/asistente/doctor (backend ya lo aplica)
      if (!profile) return;
      if (editingId) {
        const updated = await apiFetch<Paciente>(`/pacientes/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        setItems((arr) => arr.map((p) => (p.id === editingId ? updated : p)));
        setEditingId(null);
        toast.success('Paciente actualizado');
      } else {
        const created = await apiFetch<Paciente>('/pacientes', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        setItems((arr) => [created, ...arr]);
        toast.success('Paciente creado');
      }
      setForm({});
      setFormErrors({});
      setSubmitted(false);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || 'Error al guardar');
    }
  }

  function edit(p: Paciente) {
    setEditingId(p.id);
    setForm({
      nombreCompleto: p.nombreCompleto,
      fechaNacimiento: p.fechaNacimiento?.slice(0, 10),
      telefono: p.telefono || undefined,
      correo: p.correo || undefined,
      direccion: p.direccion || undefined,
      antecedentes: p.antecedentes || undefined,
    });
  }

  async function confirmRemove(id: number) {
    try {
      // Roles: eliminar sólo admin
      if (profile?.rol !== 'admin') {
        setError('No tienes permisos para eliminar');
        toast.error('No tienes permisos para eliminar');
        return;
      }
      setPendingDeleteId(id);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function performDelete(id: number) {
    try {
      await apiFetch(`/pacientes/${id}`, { method: 'DELETE' });
      setItems((arr) => arr.filter((p) => p.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm({});
      }
      toast.success('Paciente eliminado');
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || 'Error al eliminar');
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <>
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-medium">{editingId ? 'Editar paciente' : 'Crear paciente'}</h2>
          <p className="text-sm text-gray-500">Completa los datos del paciente. Los campos marcados son requeridos.</p>
        </CardHeader>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label>Nombre completo</Label>
            <Input
              placeholder="Nombre completo"
              value={form.nombreCompleto || ''}
              onChange={(e) => { handleChange('nombreCompleto', e.target.value); if (submitted) validate(); }}
              aria-invalid={!!formErrors.nombre}
              aria-describedby={formErrors.nombre ? 'pac-nombre-error' : undefined}
            />
            {formErrors.nombre && <p id="pac-nombre-error" className="text-xs text-red-600">{formErrors.nombre}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Label>Fecha de nacimiento</Label>
            <Input
              type="date"
              placeholder="Fecha de nacimiento"
              value={(form.fechaNacimiento as string) || ''}
              onChange={(e) => { handleChange('fechaNacimiento', e.target.value); if (submitted) validate(); }}
              aria-invalid={!!formErrors.fechaNacimiento}
              aria-describedby={formErrors.fechaNacimiento ? 'pac-fecha-error' : undefined}
            />
            {formErrors.fechaNacimiento && <p id="pac-fecha-error" className="text-xs text-red-600">{formErrors.fechaNacimiento}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Label>Teléfono</Label>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={8}
              placeholder="Ej. 88889999"
              value={form.telefono || ''}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 8);
                handleChange('telefono', onlyDigits as any);
                if (submitted) validate();
              }}
              aria-invalid={!!formErrors.telefono}
              aria-describedby={formErrors.telefono ? 'pac-telefono-error' : 'pac-telefono-help'}
            />
            {formErrors.telefono ? (
              <p id="pac-telefono-error" className="text-xs text-red-600">{formErrors.telefono}</p>
            ) : (
              <p id="pac-telefono-help" className="text-xs text-gray-500">El teléfono en Honduras tiene 8 dígitos.</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label>Correo</Label>
            <Input
              placeholder="Correo"
              value={form.correo || ''}
              onChange={(e) => { handleChange('correo', e.target.value); if (submitted) validate(); }}
              aria-invalid={!!formErrors.correo}
              aria-describedby={formErrors.correo ? 'pac-correo-error' : undefined}
            />
            {formErrors.correo && <p id="pac-correo-error" className="text-xs text-red-600">{formErrors.correo}</p>}
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <Label>Dirección</Label>
            <Input
              placeholder="Dirección"
              value={form.direccion || ''}
              onChange={(e) => handleChange('direccion', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <Label>Antecedentes</Label>
            <textarea
              className="border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="Antecedentes"
              value={form.antecedentes || ''}
              onChange={(e) => handleChange('antecedentes', e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={save} disabled={!profile || (submitted && Object.keys(formErrors).length > 0)}>{editingId ? 'Guardar cambios' : 'Crear'}</Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingId(null);
              setForm({});
              setFormErrors({});
              setSubmitted(false);
            }}
            disabled={!profile}
          >
            Limpiar
          </Button>
          {editingId && (
            <Button
              onClick={() => {
                setEditingId(null);
                setForm({});
              }}
              variant={"outline"}
            >
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-medium">Listado</h2>
        </CardHeader>
        {loading ? (
          <p className="text-gray-600">Cargando…</p>
        ) : sorted.length === 0 ? (
          <EmptyState title="Aún no hay pacientes" subtitle="Crea el primero con el formulario" />
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50 dark:bg-gray-800/50">
                  <th className="p-2">ID</th>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Nacimiento</th>
                  <th className="p-2">Teléfono</th>
                  <th className="p-2">Correo</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, idx) => (
                  <tr key={p.id} className={"border-b " + (idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/50')}>
                    <td className="p-2">{p.id}</td>
                    <td className="p-2">{p.nombreCompleto}</td>
                    <td className="p-2">{new Date(p.fechaNacimiento).toLocaleDateString()}</td>
                    <td className="p-2">{p.telefono || '-'}</td>
                    <td className="p-2">{p.correo || '-'}</td>
                    <td className="p-2 flex gap-2">
                      <button className="text-blue-600 hover:underline disabled:text-gray-400" onClick={() => edit(p)} disabled={!profile}>
                        Editar
                      </button>
                      <button className="text-red-600 hover:underline disabled:text-gray-400" onClick={() => confirmRemove(p.id)} disabled={profile?.rol !== 'admin'}>
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
      title="Eliminar paciente"
      description="Esta acción no se puede deshacer. ¿Deseas continuar?"
      confirmLabel="Eliminar"
      onCancel={() => setPendingDeleteId(null)}
      onConfirm={() => pendingDeleteId !== null && performDelete(pendingDeleteId)}
    />
  </>
  );
}
