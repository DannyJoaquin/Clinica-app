"use client";
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useProfile } from '@/lib/useProfile';
import { usePermissions } from '@/lib/usePermissions';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';

type Appointment = {
  id: number;
  pacienteId: number;
  doctorId: number;
  fecha: string;
  hora: string;
};

type Patient = { id: number; nombreCompleto: string; telefono?: string | null; correo?: string | null; antecedentes?: string | null };
type Doctor = { id: number; nombre: string };

type Preclinic = {
  appointmentId: number;
  weight: number;
  height: number;
  bloodPressure: string;
  temperature: number;
  heartRate: number;
  oxygenSat: number;
  reason: string;
  notes?: string | null;
};

export default function PreclinicaPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const id = Number(appointmentId);
  const router = useRouter();
  const { profile } = useProfile();
  const { loading: loadingPerms, can } = usePermissions();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [data, setData] = useState<Preclinic | null>(null);
  const [saving, setSaving] = useState(false);
  const canEdit = useMemo(() => can('preclinic.upsert'), [can]);
  const toast = useToast();

  useEffect(() => {
    if (!loadingPerms && !can('preclinic.view')) {
      router.replace('/dashboard');
      toast.error('No tienes permiso para ver esta preclínica');
      return;
    }
    if (!id) return;
    (async () => {
      const ap = await apiFetch<Appointment>(`/citas/${id}`);
      setAppt(ap);
      if (ap?.pacienteId) {
        const p = await apiFetch<Patient>(`/pacientes/${ap.pacienteId}`);
        setPatient(p);
      }
      if (ap?.doctorId) {
        const d = await apiFetch<Doctor>(`/usuarios/${ap.doctorId}`);
        setDoctor(d as any);
      }
      try {
        const pre = await apiFetch<Preclinic>(`/preclinic/${id}`);
        setData(pre);
      } catch {}
    })();
  }, [id, loadingPerms, can]);

  const [form, setForm] = useState<Preclinic>({
    appointmentId: id,
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
    if (data) setForm({ ...data, notes: data.notes ?? '' });
  }, [data]);

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
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, appointmentId: id };
      if (data) {
        await apiFetch(`/preclinic/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/preclinic`, { method: 'POST', body: JSON.stringify(payload) });
      }
      const pre = await apiFetch<Preclinic>(`/preclinic/${id}`);
      setData(pre);
      toast.success('Preclínica guardada');
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loadingPerms) return <main className="p-4"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" /></main>;
  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Preclínica</h1>
        <Link href="/citas" className="text-sm text-blue-700 underline hover:text-blue-800">Volver a Citas</Link>
      </div>

      <Card className="divide-y divide-gray-100 dark:divide-gray-800">
        <div className="p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <div><span className="text-gray-500">Cita:</span> #{appt?.id} {appt && new Date(appt.fecha).toLocaleDateString()} {appt?.hora}</div>
            <div><span className="text-gray-500">Doctor:</span> {doctor?.nombre}</div>
            <div className="col-span-1 sm:col-span-2"><span className="text-gray-500">Paciente:</span> {patient?.nombreCompleto}</div>
            {patient?.telefono && <div><span className="text-gray-500">Teléfono:</span> {patient.telefono}</div>}
            {patient?.correo && <div><span className="text-gray-500">Correo:</span> {patient.correo}</div>}
          </div>
          <div className="mt-2 md:mt-0">
            {data ? (
              <Badge variant="success">Preclínica completada</Badge>
            ) : (
              <Badge variant="warning">Preclínica pendiente</Badge>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
            {(profile?.rol === 'doctor' || profile?.rol === 'admin') && (
              <Button variant="outline" onClick={() => router.push(`/dashboard/consulta/${id}`)}>
                Ir a Consulta →
              </Button>
            )}
            {canEdit ? (
              <Button onClick={onSave} disabled={saving} loading={saving}>{data ? 'Actualizar' : 'Guardar'}</Button>
            ) : null}
          </div>
        </div>
      </Card>
    </main>
  );
}
