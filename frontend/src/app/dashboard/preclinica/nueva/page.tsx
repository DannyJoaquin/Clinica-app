"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useProfile } from '@/lib/useProfile';
import { usePermissions } from '@/lib/usePermissions';

type Patient = { id: number; nombreCompleto: string };
type Doctor = { id: number; nombre: string };

type WalkinForm = {
  patientId: number | '';
  doctorId: number | '';
  weight: number;
  height: number;
  bloodPressure: string;
  temperature: number;
  heartRate: number;
  oxygenSat: number;
  reason: string;
  notes?: string;
};

export default function NuevaPreclinicaPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { loading: loadingPerms, can } = usePermissions();
  const toast = useToast();
  const canEdit = useMemo(() => can('preclinic.upsert'), [can]);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<WalkinForm>({
    patientId: '',
    doctorId: '',
    weight: 0,
    height: 0,
    bloodPressure: '',
    temperature: 36.5,
    heartRate: 70,
    oxygenSat: 98,
    reason: '',
    notes: '',
  });

  useEffect(() => {
    // Gate: si no tiene permiso, redirigir
    if (!loadingPerms && !can('preclinic.upsert')) {
      router.replace('/dashboard');
      toast.error('No tienes permiso para acceder a Preclínica');
      return;
    }
    (async () => {
      try {
        const [pacs, docs] = await Promise.all([
          apiFetch<Patient[]>('/pacientes'),
          apiFetch<Doctor[]>('/doctores'),
        ]);
        setPatients(pacs);
        setDoctors(docs);
      } catch (e: any) {
        toast.error(e.message || 'No se pudieron cargar datos');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadingPerms, can]);

  const bmi = useMemo(() => {
    const h = Number(form.height || 0);
    const w = Number(form.weight || 0);
    if (!h || !w) return null;
    const meters = h / 100;
    if (!meters) return null;
    const val = w / (meters * meters);
    return Number.isFinite(val) ? Number(val.toFixed(1)) : null;
  }, [form.height, form.weight]);

  const bmiLabel = useMemo(() => {
    if (bmi == null) return '';
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidad';
  }, [bmi]);

  function validate(): string | null {
    if (!form.patientId) return 'Selecciona un paciente';
    if (!form.doctorId) return 'Selecciona un doctor';
    if (!form.weight || form.weight <= 0) return 'El peso debe ser mayor a 0';
    if (!form.height || form.height <= 0) return 'La altura debe ser mayor a 0';
    if (!form.bloodPressure || form.bloodPressure.trim().length < 2) return 'La presión arterial es requerida';
    if (form.temperature < 30 || form.temperature > 45) return 'Temperatura fuera de rango (30-45 °C)';
    if (!form.heartRate || form.heartRate <= 0) return 'La frecuencia cardiaca debe ser mayor a 0';
    if (form.oxygenSat < 0 || form.oxygenSat > 100) return 'La saturación debe estar entre 0 y 100';
    if (!form.reason || form.reason.trim().length < 2) return 'El motivo de consulta es requerido';
    return null;
  }

  async function onSave() {
    if (!canEdit) return;
    const err = validate();
    if (err) return toast.error(err);
    try {
      const resp = await apiFetch<any>('/preclinic/walkin', {
        method: 'POST',
        body: JSON.stringify({
          patientId: form.patientId,
          doctorId: form.doctorId,
          weight: form.weight,
          height: form.height,
          bloodPressure: form.bloodPressure,
          temperature: form.temperature,
          heartRate: form.heartRate,
          oxygenSat: form.oxygenSat,
          reason: form.reason,
          notes: form.notes,
        }),
      });
      toast.success('Preclínica registrada');
      if (resp?.appointmentId) {
        router.push(`/dashboard/consulta/${resp.appointmentId}`);
      } else {
        router.push('/citas');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    }
  }

  if (loadingPerms) return <main className="p-4"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" /></main>;

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nueva preclínica (sin cita)</h1>
        <Link href="/citas" className="text-sm text-blue-700 underline hover:text-blue-800">Volver a Citas</Link>
      </div>

      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block mb-1 text-sm text-gray-700 font-medium">Paciente</label>
            <Select
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: Number(e.target.value) || '' })}
              disabled={!canEdit || loading}
            >
              <option value="">Selecciona un paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.nombreCompleto}</option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-3">
            <label className="block mb-1 text-sm text-gray-700 font-medium">Doctor</label>
            <Select
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: Number(e.target.value) || '' })}
              disabled={!canEdit || loading}
            >
              <option value="">Selecciona un doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-700 font-medium">Peso (kg)</label>
            <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) })} disabled={!canEdit} />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700 font-medium">Altura (cm)</label>
            <Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: parseFloat(e.target.value) })} disabled={!canEdit} />
          </div>
          <div className="flex flex-col">
            <label className="block mb-1 text-sm text-gray-700 font-medium">IMC</label>
            <div>
              {bmi != null ? (
                <Badge variant={bmi < 18.5 ? 'warning' : bmi < 25 ? 'success' : bmi < 30 ? 'info' : 'destructive'}>
                  {bmi} • {bmiLabel}
                </Badge>
              ) : (
                <span className="text-sm text-gray-500">Ingrese peso y altura</span>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-700 font-medium">Presión arterial</label>
            <Input value={form.bloodPressure} onChange={(e) => setForm({ ...form, bloodPressure: e.target.value })} disabled={!canEdit} />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700 font-medium">Temperatura (°C)</label>
            <Input type="number" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })} disabled={!canEdit} />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700 font-medium">Frecuencia cardiaca (bpm)</label>
            <Input type="number" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: parseInt(e.target.value) || 0 })} disabled={!canEdit} />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700 font-medium">Saturación O2 (%)</label>
            <Input type="number" value={form.oxygenSat} onChange={(e) => setForm({ ...form, oxygenSat: parseInt(e.target.value) || 0 })} disabled={!canEdit} />
          </div>
          <div className="md:col-span-3">
            <label className="block mb-1 text-sm text-gray-700 font-medium">Motivo de consulta</label>
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} disabled={!canEdit} />
          </div>
          <div className="md:col-span-3">
            <label className="block mb-1 text-sm text-gray-700 font-medium">Notas</label>
            <Textarea value={form.notes || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })} disabled={!canEdit} />
          </div>
        </div>
        <div className="p-4 border-t flex items-center justify-between gap-3 flex-wrap bg-gray-50/60 dark:bg-gray-900/40">
          <div className="text-xs text-gray-500">{canEdit ? 'Asistente/Admin pueden editar' : 'Solo lectura'}</div>
          <div className="flex gap-2">
            <Button onClick={onSave}>Guardar</Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
