"use client";
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useProfile } from '@/lib/useProfile';

type Usuario = { id: number; nombre: string; correo: string; rol: string };

export default function UsuariosPage() {
  const { profile, loading: loadingProfile } = useProfile();
  const toast = useToast();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Usuario> & { contrasena?: string }>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadedRef = useRef(false);
  const errorShownRef = useRef(false);
  useEffect(() => {
    if (loadingProfile) return;
    if (!profile || profile.rol !== 'admin') return;
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Usuario[]>('/usuarios');
        setUsuarios(data);
      } catch (e: any) {
        if (!errorShownRef.current) {
          toast.error('No se pudieron cargar los usuarios');
          errorShownRef.current = true;
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [loadingProfile, profile?.rol]);

  function handleChange<K extends keyof (Usuario & { contrasena?: string })>(key: K, val: any) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function save() {
    try {
      if (editingId) {
        const updated = await apiFetch<Usuario>(`/usuarios/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
        setUsuarios((arr) => arr.map((u) => (u.id === updated.id ? updated : u)));
        toast.success('Usuario actualizado');
      } else {
        const created = await apiFetch<Usuario>('/usuarios', { method: 'POST', body: JSON.stringify(form) });
        setUsuarios((arr) => [...arr, created]);
        toast.success('Usuario creado');
      }
      setForm({});
      setEditingId(null);
    } catch (e: any) {
      toast.error('Error guardando usuario');
    }
  }

  async function remove(id: number) {
    try {
      await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
      setUsuarios((arr) => arr.filter((u) => u.id !== id));
      toast.success('Usuario eliminado');
    } catch (e: any) {
      toast.error('Error eliminando usuario');
    }
  }

  if (loadingProfile) {
    return (
      <main className="p-6"><p className="text-gray-600">Cargando…</p></main>
    );
  }

  if (profile?.rol !== 'admin') {
    return (
      <main className="p-6">
        <Card>
          <CardHeader>
            <h2 className="font-medium">Usuarios</h2>
          </CardHeader>
          <p className="text-gray-600">No tienes permisos para ver esta sección.</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Usuarios</h1>
      <Card>
        <CardHeader>
          <h2 className="font-medium">Gestión</h2>
        </CardHeader>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 p-4">
          <Input placeholder="Nombre" value={form.nombre || ''} onChange={(e) => handleChange('nombre', e.target.value)} />
          <Input placeholder="Correo" value={form.correo || ''} onChange={(e) => handleChange('correo', e.target.value)} />
          <Select value={form.rol || ''} onChange={(e) => handleChange('rol', e.target.value)}>
            <option value="">Rol…</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="asistente">Asistente</option>
          </Select>
          <Input placeholder="Contraseña" type="password" value={form.contrasena || ''} onChange={(e) => handleChange('contrasena', e.target.value)} />
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <Button onClick={save}>{editingId ? 'Guardar' : 'Crear usuario'}</Button>
          <Button variant="outline" onClick={() => { setEditingId(null); setForm({}); }}>Limpiar</Button>
          {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm({}); }}>Cancelar</Button>}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-medium">Listado</h2>
        </CardHeader>
        <div className="overflow-auto">
          {loading ? (
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
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(u.id); setForm({ nombre: u.nombre, correo: u.correo, rol: u.rol }); }}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(u.id)}>Eliminar</Button>
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
