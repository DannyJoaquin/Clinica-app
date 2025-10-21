"use client";
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch, apiFetchBlob, API_URL, getToken } from '@/lib/api';
import type { Paciente, Receta, RecetaInput, Doctor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/lib/useProfile';

export default function RecetasPage() {
  useAuthGuard();
  const toast = useToast();
  const { profile } = useProfile();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | ''>('');
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [items, setItems] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<RecetaInput>>({});
  const [creating, setCreating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [filter, setFilter] = useState('');

  const pacientesSorted = useMemo(
    () => pacientes.slice().sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto)),
    [pacientes]
  );
  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (r) => String(r.id).includes(q) || r.medicamentos.toLowerCase().includes(q)
    );
  }, [filter, items]);

  useEffect(() => {
    (async () => {
      try {
        const [pacs, docs] = await Promise.all([
          apiFetch<Paciente[]>('/pacientes'),
          apiFetch<Doctor[]>('/doctores'),
        ]);
        setPacientes(pacs);
        setDoctores(docs);
      } catch (e: any) {
        setError(e.message);
        toast.error(e.message || 'Error al cargar');
      }
    })();
  }, []);

  async function loadRecetas(pacienteId: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Receta[]>(`/pacientes/${pacienteId}/recetas`);
      setItems(data);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || 'Error al cargar recetas');
    } finally {
      setLoading(false);
    }
  }

  function onSelectPaciente(val: string) {
    const id = val ? Number(val) : '';
    setSelectedPacienteId(id as any);
    if (id) loadRecetas(id);
    setItems([]);
  }

  function handleChange<K extends keyof RecetaInput>(key: K, val: RecetaInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function createReceta() {
    try {
      setError(null);
      setCreating(true);
      if (!(profile?.rol === 'admin' || profile?.rol === 'doctor')) {
        setError('No tienes permisos para crear recetas');
        return;
      }
      if (!form.pacienteId || !form.doctorId || !form.medicamentos) {
        setError('Paciente, doctor y medicamentos son obligatorios');
        return;
      }
      const created = await apiFetch<Receta>('/recetas', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (selectedPacienteId && created.pacienteId === selectedPacienteId) {
        setItems((arr) => [created, ...arr]);
      }
      toast.success('Receta creada');
      setForm({});
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || 'Error al crear receta');
    } finally {
      setCreating(false);
    }
  }

  async function descargarPdf(id: number) {
    try {
      setDownloadingId(id);
      const token = getToken();
      const url = `${API_URL}/recetas/${id}/pdf`;
      const a = document.createElement('a');
      a.href = token ? `${url}?token=${encodeURIComponent(token)}` : url;
      try {
        const blob = await apiFetchBlob(`/recetas/${id}/pdf`);
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = `receta-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      } catch {
        window.open(a.href, '_blank');
      }
      toast.success('PDF descargado');
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || 'Error al descargar PDF');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Recetas</h1>

      <Card>
        <CardHeader>
          <h2 className="font-medium">Crear receta</h2>
          {error && <p className="text-red-600 mt-1">{error}</p>}
        </CardHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label>Paciente</Label>
            <Select
              value={form.pacienteId || ''}
              onChange={(e) => handleChange('pacienteId', Number(e.target.value) as any)}
              disabled={!(profile?.rol === 'admin' || profile?.rol === 'doctor')}
            >
              <option value="">Seleccione paciente</option>
              {pacientesSorted.map((p) => (
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
              disabled={!(profile?.rol === 'admin' || profile?.rol === 'doctor')}
            >
              <option value="">Seleccione doctor</option>
              {doctores.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2 flex flex-col gap-1">
            <Label>Medicamentos</Label>
            <Input
              placeholder="Medicamentos"
              value={form.medicamentos || ''}
              onChange={(e) => handleChange('medicamentos', e.target.value as any)}
              disabled={!(profile?.rol === 'admin' || profile?.rol === 'doctor')}
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1">
            <Label>Instrucciones (opcional)</Label>
            <Input
              placeholder="Instrucciones"
              value={form.instrucciones || ''}
              onChange={(e) => handleChange('instrucciones', e.target.value as any)}
              disabled={!(profile?.rol === 'admin' || profile?.rol === 'doctor')}
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={createReceta} loading={creating} disabled={!(profile?.rol === 'admin' || profile?.rol === 'doctor')}>Crear</Button>
          <Button
            variant="outline"
            onClick={() => setForm({})}
            disabled={!(profile?.rol === 'admin' || profile?.rol === 'doctor')}
          >
            Limpiar
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-medium">Listado por paciente</h2>
          <div className="flex gap-2">
            <Select
              value={selectedPacienteId || ''}
              onChange={(e) => onSelectPaciente(e.target.value)}
            >
              <option value="">Seleccione paciente…</option>
              {pacientesSorted.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombreCompleto}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Buscar por ID o medicamento"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </CardHeader>
        {loading ? (
          <p className="text-gray-600">Cargando…</p>
        ) : selectedPacienteId ? (
          filtered.length === 0 ? (
            <EmptyState title="Sin resultados" subtitle="Ajusta el filtro o crea una receta" />
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-2">ID</th>
                    <th className="p-2">Fecha</th>
                    <th className="p-2">Medicamentos</th>
                    <th className="p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => (
                    <tr key={r.id} className={"border-b " + (idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/50')}>
                      <td className="p-2">{r.id}</td>
                      <td className="p-2">{new Date(r.fechaEmision).toLocaleDateString()}</td>
                      <td className="p-2 truncate max-w-md">{r.medicamentos}</td>
                      <td className="p-2">
                        <Button variant="outline" size="sm" onClick={() => descargarPdf(r.id)} disabled={downloadingId === r.id}>
                          {downloadingId === r.id ? 'Descargando…' : 'Descargar PDF'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <p className="text-gray-600">Seleccione un paciente para ver sus recetas.</p>
        )}
      </Card>
    </main>
  );
}
