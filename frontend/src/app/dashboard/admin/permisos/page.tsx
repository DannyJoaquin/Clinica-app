"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { useProfile } from '@/lib/useProfile';
import { apiFetch } from '@/lib/api';

type Permission = { id: number; key: string; name?: string | null };
type RolePerm = { id: number; role: string; permissionId: number; permission: Permission };

const ROLES: Array<'admin' | 'doctor' | 'asistente'> = ['admin', 'doctor', 'asistente'];
const SUGGESTED: Array<{ key: string; name: string }> = [
  { key: 'citas.view', name: 'Ver citas' },
  { key: 'citas.create', name: 'Crear cita' },
  { key: 'citas.update', name: 'Actualizar cita' },
  { key: 'preclinic.view', name: 'Ver preclínica' },
  { key: 'preclinic.upsert', name: 'Editar/Crear preclínica' },
  { key: 'consulta.view', name: 'Ver consulta' },
  { key: 'consulta.create', name: 'Crear/Guardar consulta' },
  { key: 'pacientes.view', name: 'Ver pacientes' },
  { key: 'pacientes.create', name: 'Crear paciente' },
  { key: 'pagos.view', name: 'Ver pagos' },
];

export default function AdminPermissionsPage() {
  const toast = useToast();
  const { profile, loading: loadingProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Set<number>>>({}); // role -> set(permissionId)
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'doctor' | 'asistente'>('doctor');

  async function loadAll() {
    try {
      setLoading(true);
      const [permsList, ...roleLists] = await Promise.all([
        apiFetch<Permission[]>(`/admin/permissions`),
        ...ROLES.map((r) => apiFetch<RolePerm[]>(`/admin/permissions/role/${r}`)),
      ]);
      setPerms(permsList);
      const nextMatrix: Record<string, Set<number>> = {};
      ROLES.forEach((r, idx) => {
        nextMatrix[r] = new Set(roleLists[idx].map((rp) => rp.permissionId));
      });
      setMatrix(nextMatrix);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo cargar permisos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loadingProfile && profile?.rol === 'admin') {
      loadAll();
    }
  }, [loadingProfile, profile?.rol]);

  async function createPermission() {
    const key = newKey.trim();
    try {
      if (!key) return toast.error('Ingresa un key');
      const created = await apiFetch<Permission>(`/admin/permissions`, {
        method: 'POST',
        body: JSON.stringify({ key, name: newName || undefined }),
      });
      setPerms((prev) => [...prev, created].sort((a, b) => a.key.localeCompare(b.key)));
      setNewKey('');
      setNewName('');
      toast.success('Permiso creado');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo crear');
    }
  }

  async function ensurePermission(key: string, name?: string) {
    const existing = perms.find((p) => p.key === key);
    if (existing) return existing;
    try {
      const created = await apiFetch<Permission>(`/admin/permissions`, {
        method: 'POST',
        body: JSON.stringify({ key, name }),
      });
      setPerms((prev) => [...prev, created].sort((a, b) => a.key.localeCompare(b.key)));
      return created;
    } catch (e: any) {
      throw new Error(e?.message || 'No se pudo crear el permiso');
    }
  }

  async function deletePermission(id: number) {
    const ok = confirm('¿Eliminar este permiso?');
    if (!ok) return;
    try {
      await apiFetch(`/admin/permissions/${id}`, { method: 'DELETE' });
      setPerms((prev) => prev.filter((p) => p.id !== id));
      const nm: Record<string, Set<number>> = {};
      for (const r of ROLES) {
        nm[r] = new Set(Array.from(matrix[r] || []).filter((pid) => pid !== id));
      }
      setMatrix(nm);
      toast.success('Eliminado');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo eliminar');
    }
  }

  async function toggle(role: string, permissionId: number) {
    const assigned = matrix[role]?.has(permissionId);
    try {
      if (assigned) {
        await apiFetch(`/admin/permissions/role/${role}/revoke`, { method: 'POST', body: JSON.stringify({ permissionId }) });
        setMatrix((prev) => ({ ...prev, [role]: new Set(Array.from(prev[role] || []).filter((id) => id !== permissionId)) }));
      } else {
        await apiFetch(`/admin/permissions/role/${role}/grant`, { method: 'POST', body: JSON.stringify({ permissionId }) });
        const next = new Set(matrix[role] || new Set<number>());
        next.add(permissionId);
        setMatrix((prev) => ({ ...prev, [role]: next }));
      }
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo actualizar');
    }
  }

  async function toggleSuggested(role: string, key: string, name: string, nextChecked: boolean) {
    try {
      if (nextChecked) {
        // asegurar permiso, luego grant
        const perm = await ensurePermission(key, name);
        if (!matrix[role]?.has(perm.id)) {
          await apiFetch(`/admin/permissions/role/${role}/grant`, { method: 'POST', body: JSON.stringify({ permissionId: perm.id }) });
          const next = new Set(matrix[role] || new Set<number>());
          next.add(perm.id);
          setMatrix((prev) => ({ ...prev, [role]: next }));
          toast.success('Permiso asignado');
        }
      } else {
        const perm = perms.find((p) => p.key === key);
        if (perm && matrix[role]?.has(perm.id)) {
          await apiFetch(`/admin/permissions/role/${role}/revoke`, { method: 'POST', body: JSON.stringify({ permissionId: perm.id }) });
          setMatrix((prev) => ({ ...prev, [role]: new Set(Array.from(prev[role] || []).filter((id) => id !== perm.id)) }));
          toast.success('Permiso revocado');
        }
      }
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo actualizar');
    }
  }

  async function assignAllSuggested() {
    try {
      const role = selectedRole;
      for (const s of SUGGESTED) {
        const perm = await ensurePermission(s.key, s.name);
        if (!matrix[role]?.has(perm.id)) {
          await apiFetch(`/admin/permissions/role/${role}/grant`, { method: 'POST', body: JSON.stringify({ permissionId: perm.id }) });
          const next = new Set(matrix[role] || new Set<number>());
          next.add(perm.id);
          setMatrix((prev) => ({ ...prev, [role]: next }));
        }
      }
      toast.success('Permisos sugeridos asignados');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo asignar');
    }
  }

  async function revokeAllSuggested() {
    try {
      const role = selectedRole;
      for (const s of SUGGESTED) {
        const perm = perms.find((p) => p.key === s.key);
        if (perm && matrix[role]?.has(perm.id)) {
          await apiFetch(`/admin/permissions/role/${role}/revoke`, { method: 'POST', body: JSON.stringify({ permissionId: perm.id }) });
          setMatrix((prev) => ({ ...prev, [role]: new Set(Array.from(prev[role] || []).filter((id) => id !== perm.id)) }));
        }
      }
      toast.success('Permisos sugeridos revocados');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo revocar');
    }
  }

  if (loadingProfile) return <main className="p-4"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" /></main>;
  if (profile?.rol !== 'admin') {
    return (
      <main className="space-y-6">
        <Card>
          <div className="p-4">
            <h2 className="font-medium">Permisos</h2>
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
          <h1 className="text-2xl font-semibold">Gestión de permisos</h1>
          <p className="text-gray-600 dark:text-gray-300">Asigna permisos a roles.</p>
        </div>
        <Link href="/dashboard/admin" className="text-sm text-blue-600 hover:underline">Volver al panel</Link>
      </div>

      {/* Permisos sugeridos (checkbox) */}
      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-medium">Permisos sugeridos</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-300">Rol:</span>
              <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as any)}>
                {ROLES.map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={assignAllSuggested} disabled={loading}>Asignar todos</Button>
            <Button variant="outline" onClick={revokeAllSuggested} disabled={loading}>Quitar todos</Button>
            <Button variant="outline" onClick={loadAll} disabled={loading}>Refrescar</Button>
          </div>
        </div>
        <div className="p-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SUGGESTED.map((s) => {
            const perm = perms.find((p) => p.key === s.key);
            const checked = perm ? !!matrix[selectedRole]?.has(perm.id) : false;
            return (
              <label key={s.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => toggleSuggested(selectedRole, s.key, s.name, e.target.checked)}
                />
                <span>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-gray-500">({s.key})</span>
                </span>
              </label>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-medium">Crear permiso (avanzado)</h3>
        </div>
        <div className="p-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs text-gray-500">Código (técnico)</label>
            <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="ej. consulta.create" />
            <div className="text-[11px] text-gray-500 mt-1">Si no conoces el código, usa la sección de Permisos sugeridos.</div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Nombre (opcional)</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Crear consulta" />
          </div>
          <div className="flex items-end">
            <Button onClick={createPermission} disabled={loading}>Crear</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-medium">Permisos del rol</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-300">Rol:</span>
              <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as any)}>
                {ROLES.map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </Select>
            </div>
          </div>
          <Button variant="outline" onClick={loadAll} disabled={loading}>Refrescar</Button>
        </div>
        {/* Resumen de permisos actuales del rol */}
        <div className="px-4 py-4">
          <div className="text-xs text-gray-500 mb-2">Permisos asignados actualmente</div>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const ids = Array.from(matrix[selectedRole] || []);
              if (ids.length === 0) return <span className="text-sm text-gray-500">Sin permisos asignados</span>;
              return ids
                .map((id) => perms.find((p) => p.id === id))
                .filter(Boolean)
                .map((p) => (
                  <span key={p!.id} className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs">
                    {p!.name || p!.key}
                  </span>
                ));
            })()}
          </div>
          <p className="text-[11px] text-gray-500 mt-3">Usa los checkboxes de "Permisos sugeridos" para asignar o quitar permisos. Si necesitás otro, crealo en "Crear permiso (avanzado)".</p>
        </div>
      </Card>
    </main>
  );
}
