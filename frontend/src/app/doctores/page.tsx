"use client";
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Doctor, UsuarioProfile } from '@/lib/types';
import { Card, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';

export default function DoctoresPage() {
  useAuthGuard();
  const toast = useToast();
  const [items, setItems] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState<{ nombre: string; correo: string; contrasena: string }>({ nombre: '', correo: '', contrasena: '' });
  const [creating, setCreating] = useState(false);
  const [me, setMe] = useState<UsuarioProfile | null>(null);

  const isAdmin = me?.rol === 'admin';
  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return items;
    return items.filter(d => String(d.id).includes(q) || d.nombre.toLowerCase().includes(q) || d.correo.toLowerCase().includes(q));
  }, [filter, items]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [docs, profile] = await Promise.all([
        apiFetch<Doctor[]>('/doctores'),
        apiFetch<UsuarioProfile>('/auth/profile').catch(() => null as any),
      ]);
      setItems(docs);
      if (profile) setMe(profile);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function createDoctor() {
    try {
      setError(null);
      setCreating(true);
      if (!form.nombre || !form.correo || !form.contrasena) {
        setError('Nombre, correo y contraseña son obligatorios');
        return;
      }
      const created = await apiFetch<Doctor>('/doctores', {
        method: 'POST',
        body: JSON.stringify({ nombre: form.nombre, correo: form.correo, contrasena: form.contrasena }),
      });
      setItems(arr => [created, ...arr]);
      setForm({ nombre: '', correo: '', contrasena: '' });
      toast.success('Doctor creado');
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || 'Error al crear doctor');
    } finally {
      setCreating(false);
    }
  }

  async function removeDoctor(id: number) {
    try {
      await apiFetch(`/doctores/${id}`, { method: 'DELETE' });
      setItems(arr => arr.filter(d => d.id !== id));
      toast.success('Doctor eliminado');
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || 'Error al eliminar doctor');
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Doctores</h1>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between gap-2">
          <h2 className="font-medium">Listado</h2>
          <Input placeholder="Buscar por nombre, correo o ID" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </CardHeader>
        {loading ? (
          <p className="text-gray-600">Cargando…</p>
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin doctores" subtitle="Crea un doctor para comenzar" />
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">ID</th>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Correo</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="p-2">{d.id}</td>
                    <td className="p-2">{d.nombre}</td>
                    <td className="p-2">{d.correo}</td>
                    <td className="p-2">
                      {isAdmin ? (
                        <button className="text-red-600 hover:underline" onClick={() => removeDoctor(d.id)}>Eliminar</button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-medium">Crear doctor</h2>
          {!isAdmin && (
            <p className="text-xs text-gray-500">Solo los administradores pueden crear o eliminar doctores.</p>
          )}
          {error && <p className="text-red-600 mt-1">{error}</p>}
        </CardHeader>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label>Nombre</Label>
            <Input placeholder="Nombre" value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} disabled={!isAdmin} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Correo</Label>
            <Input placeholder="Correo" value={form.correo} onChange={(e) => handleChange('correo', e.target.value)} disabled={!isAdmin} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Contraseña</Label>
            <Input placeholder="Contraseña" type="password" value={form.contrasena} onChange={(e) => handleChange('contrasena', e.target.value)} disabled={!isAdmin} />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={createDoctor} loading={creating} disabled={!isAdmin}>Crear</Button>
          <Button variant="outline" onClick={() => setForm({ nombre: '', correo: '', contrasena: '' })} disabled={!isAdmin}>Limpiar</Button>
        </div>
      </Card>
    </main>
  );
}
