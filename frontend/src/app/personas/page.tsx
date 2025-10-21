"use client";
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Paciente, PacienteInput, UsuarioProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useProfile } from '@/lib/useProfile';

type Usuario = { id: number; nombre: string; correo: string; rol: string };

export default function PersonasPage() {
  const { profile, loading: loadingProfile } = useProfile();
  const toast = useToast();

  // Usuarios state
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [uLoading, setULoading] = useState(false);
  const [uForm, setUForm] = useState<Partial<Usuario> & { contrasena?: string }>({});
  const [uEditingId, setUEditingId] = useState<number | null>(null);

  // Pacientes state
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pLoading, setPLoading] = useState(false);
  const [pForm, setPForm] = useState<Partial<PacienteInput>>({});
  const [pEditingId, setPEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!profile) return;
    // load usuarios (admin only)
    (async () => {
      try {
        setULoading(true);
        const data = await apiFetch<Usuario[]>('/usuarios');
        setUsuarios(data);
      } catch (e: any) {
        // If forbidden (non-admin), ignore
      } finally {
        setULoading(false);
      }
    })();
    // load pacientes
    (async () => {
      try {
        setPLoading(true);
        const data = await apiFetch<Paciente[]>('/pacientes');
        setPacientes(data);
      } catch (e: any) {
        toast.error('Error al cargar pacientes');
      } finally {
        setPLoading(false);
      }
    })();
  }, [profile, toast]);

  // Usuarios handlers
  function uChange<K extends keyof (Usuario & { contrasena?: string })>(key: K, val: any) {
    setUForm((f) => ({ ...f, [key]: val }));
  }
  async function uSave() {
    try {
      if (uEditingId) {
        const updated = await apiFetch<Usuario>(`/usuarios/${uEditingId}`, { method: 'PUT', body: JSON.stringify(uForm) });
  setUsuarios((arr) => arr.map((u) => (u.id === updated.id ? updated : u)));
  toast.success('Usuario actualizado');
      } else {
        const created = await apiFetch<Usuario>('/usuarios', { method: 'POST', body: JSON.stringify(uForm) });
  setUsuarios((arr) => [...arr, created]);
  toast.success('Usuario creado');
      }
      setUForm({});
      setUEditingId(null);
    } catch (e: any) {
      toast.error('Error guardando usuario');
    }
  }
  async function uDelete(id: number) {
    try {
      await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
  setUsuarios((arr) => arr.filter((u) => u.id !== id));
  toast.success('Usuario eliminado');
    } catch (e: any) {
      toast.error('Error eliminando usuario');
    }
  }

  // Pacientes handlers
  function pChange<K extends keyof PacienteInput>(key: K, val: PacienteInput[K]) {
    setPForm((f) => ({ ...f, [key]: val }));
  }
  async function pSave() {
    try {
      if (pEditingId) {
        const updated = await apiFetch<Paciente>(`/pacientes/${pEditingId}`, { method: 'PUT', body: JSON.stringify(pForm) });
  setPacientes((arr) => arr.map((p) => (p.id === updated.id ? updated : p)));
  toast.success('Paciente actualizado');
      } else {
        const created = await apiFetch<Paciente>('/pacientes', { method: 'POST', body: JSON.stringify(pForm) });
  setPacientes((arr) => [...arr, created]);
  toast.success('Paciente creado');
      }
      setPForm({});
      setPEditingId(null);
    } catch (e: any) {
      toast.error('Error guardando paciente');
    }
  }
  async function pDelete(id: number) {
    try {
      await apiFetch(`/pacientes/${id}`, { method: 'DELETE' });
  setPacientes((arr) => arr.filter((p) => p.id !== id));
  toast.success('Paciente eliminado');
    } catch (e: any) {
      toast.error('Error eliminando paciente');
    }
  }

  const pSorted = useMemo(() => pacientes.slice().sort((a, b) => a.id - b.id), [pacientes]);

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Personas</h1>

      {/* Usuarios (solo admin) */}
      {profile?.rol === 'admin' && (
        <Card>
          <CardHeader>
            <h2 className="font-medium">Usuarios</h2>
          </CardHeader>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 p-4">
            <Input placeholder="Nombre" value={uForm.nombre || ''} onChange={(e) => uChange('nombre', e.target.value)} />
            <Input placeholder="Correo" value={uForm.correo || ''} onChange={(e) => uChange('correo', e.target.value)} />
            <Select value={uForm.rol || ''} onChange={(e) => uChange('rol', e.target.value)}>
              <option value="">Rol…</option>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="asistente">Asistente</option>
            </Select>
            <Input placeholder="Contraseña" type="password" value={uForm.contrasena || ''} onChange={(e) => uChange('contrasena', e.target.value)} />
          </div>
          <div className="px-4 pb-4 flex gap-2">
            <Button onClick={uSave}>{uEditingId ? 'Guardar' : 'Crear usuario'}</Button>
            {uEditingId && <Button variant="outline" onClick={() => { setUEditingId(null); setUForm({}); }}>Cancelar</Button>}
          </div>
          <div className="overflow-auto">
            {uLoading ? (
              <p className="text-gray-600 p-4">Cargando…</p>
            ) : usuarios.length === 0 ? (
              <EmptyState title="Aún no hay usuarios" subtitle="Crea el primero con el formulario" />
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-2">ID</th>
                    <th className="p-2">Nombre</th>
                    <th className="p-2">Correo</th>
                    <th className="p-2">Rol</th>
                    <th className="p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, idx) => (
                    <tr key={u.id} className={"border-b " + (idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/50')}>
                      <td className="p-2">{u.id}</td>
                      <td className="p-2">{u.nombre}</td>
                      <td className="p-2">{u.correo}</td>
                      <td className="p-2 capitalize">{u.rol}</td>
                      <td className="p-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setUEditingId(u.id); setUForm({ nombre: u.nombre, correo: u.correo, rol: u.rol }); }}>Editar</Button>
                        <Button size="sm" variant="destructive" onClick={() => uDelete(u.id)}>Eliminar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* Pacientes */}
      <Card>
        <CardHeader>
          <h2 className="font-medium">Pacientes</h2>
        </CardHeader>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 p-4">
          <Input placeholder="Nombre completo" value={pForm.nombreCompleto || ''} onChange={(e) => pChange('nombreCompleto', e.target.value)} />
          <Input type="date" placeholder="Fecha de nacimiento" value={(pForm.fechaNacimiento as string) || ''} onChange={(e) => pChange('fechaNacimiento', e.target.value)} />
          <Input placeholder="Teléfono" value={pForm.telefono || ''} onChange={(e) => pChange('telefono', e.target.value)} />
          <Input placeholder="Correo" value={pForm.correo || ''} onChange={(e) => pChange('correo', e.target.value)} />
          <Input placeholder="Dirección" value={pForm.direccion || ''} onChange={(e) => pChange('direccion', e.target.value)} />
          <textarea className="border rounded px-3 py-2 md:col-span-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Antecedentes" value={pForm.antecedentes || ''} onChange={(e) => pChange('antecedentes', e.target.value)} />
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <Button onClick={pSave}>{pEditingId ? 'Guardar' : 'Crear paciente'}</Button>
          {pEditingId && <Button variant="outline" onClick={() => { setPEditingId(null); setPForm({}); }}>Cancelar</Button>}
        </div>
        <div className="overflow-auto">
          {pLoading ? (
            <p className="text-gray-600 p-4">Cargando…</p>
          ) : pSorted.length === 0 ? (
            <EmptyState title="Aún no hay pacientes" subtitle="Crea el primero con el formulario" />
          ) : (
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
                {pSorted.map((p, idx) => (
                  <tr key={p.id} className={"border-b " + (idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/50')}>
                    <td className="p-2">{p.id}</td>
                    <td className="p-2">{p.nombreCompleto}</td>
                    <td className="p-2">{new Date(p.fechaNacimiento).toLocaleDateString()}</td>
                    <td className="p-2">{p.telefono || '-'}</td>
                    <td className="p-2">{p.correo || '-'}</td>
                    <td className="p-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setPEditingId(p.id); setPForm({ nombreCompleto: p.nombreCompleto, fechaNacimiento: p.fechaNacimiento.slice(0,10), telefono: p.telefono || undefined, correo: p.correo || undefined, direccion: p.direccion || undefined, antecedentes: p.antecedentes || undefined }); }}>Editar</Button>
                      {profile?.rol === 'admin' && <Button size="sm" variant="destructive" onClick={() => pDelete(p.id)}>Eliminar</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </main>
  );
}
