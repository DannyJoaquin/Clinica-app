"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { useProfile } from '@/lib/useProfile';
import { usePermissions } from '@/lib/usePermissions';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';

type Appointment = { id: number; pacienteId: number; doctorId: number; fecha: string; hora: string };
type Patient = { id: number; nombreCompleto: string; fechaNacimiento: string; telefono?: string | null; correo?: string | null; antecedentes?: string | null };
type Doctor = { id: number; nombre: string };
type Preclinic = { weight: number; height: number; bloodPressure: string; temperature: number; heartRate: number; oxygenSat: number; reason: string; notes?: string | null } | null;
type Consultation = { diagnosis: string; treatment: string; notes?: string | null };

export default function ConsultaPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const id = Number(appointmentId);
  const { profile } = useProfile();
  const { loading: loadingPerms, can } = usePermissions();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [pre, setPre] = useState<Preclinic>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [marking, setMarking] = useState(false);
  const canEdit = useMemo(() => can('consulta.create'), [can]);
  const toast = useToast();

  useEffect(() => {
    if (!loadingPerms && !can('consulta.view')) {
      // Gate: sin permiso de ver, fuera
      window.location.href = '/dashboard';
      return;
    }
    if (!id) return;
    (async () => {
      const ap = await apiFetch<Appointment>(`/citas/${id}`);
      setAppt(ap);
      if (ap?.pacienteId) {
        const p = await apiFetch<Patient>(`/pacientes/${ap.pacienteId}`);
        setPatient(p);
        if (canEdit) {
          try {
            const hist = await apiFetch<any[]>(`/consultations/patient/${ap.pacienteId}`);
            setHistory(hist);
          } catch {}
        }
      }
      if (ap?.doctorId) {
        try {
          const d = await apiFetch<Doctor>(`/doctores/${ap.doctorId}`);
          setDoctor(d);
        } catch {}
      }
      try {
        const pr = await apiFetch<any>(`/preclinic/${id}`);
        setPre(pr);
      } catch {}
    })();
  }, [id, canEdit, loadingPerms, can]);

  const [form, setForm] = useState<Consultation>({ diagnosis: '', treatment: '', notes: '' });

  function validate(): string | null {
    if (!form.diagnosis || form.diagnosis.trim().length < 2) return 'El diagnóstico es requerido';
    if (!form.treatment || form.treatment.trim().length < 2) return 'El tratamiento es requerido';
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
      await apiFetch(`/consultations`, { method: 'POST', body: JSON.stringify({ appointmentId: id, ...form }) });
      toast.success('Consulta guardada');
      // refresh history
      if (appt?.pacienteId) {
        const hist = await apiFetch<any[]>(`/consultations/patient/${appt.pacienteId}`);
        setHistory(hist);
      }
      setForm({ diagnosis: '', treatment: '', notes: '' });
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function markAsDone() {
    if (!appt?.id) return;
    setMarking(true);
    try {
      await apiFetch(`/citas/${appt.id}`, { method: 'PUT', body: JSON.stringify({ estado: 'realizada' }) });
      toast.success('Cita marcada como realizada');
    } catch (e: any) {
      toast.error(e.message || 'No se pudo marcar como realizada');
    } finally {
      setMarking(false);
    }
  }

  if (loadingPerms) return <main className="p-4"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" /></main>;
  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Consulta</h1>
        <Link href="/citas" className="text-sm underline">Volver a Citas</Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="p-4 space-y-2 text-sm">
            <div className="font-medium">Paciente</div>
            <div>{patient?.nombreCompleto}</div>
            {patient?.telefono && <div>Tel: {patient.telefono}</div>}
            {patient?.correo && <div>Correo: {patient.correo}</div>}
            {patient?.antecedentes && <div className="text-gray-600 dark:text-gray-300">Ant: {patient.antecedentes}</div>}
          </div>
        </Card>
        <Card>
          <div className="p-4 space-y-2 text-sm">
            <div className="font-medium">Doctor</div>
            <div>{doctor?.nombre}</div>
            <div className="text-gray-600 dark:text-gray-300">Cita #{appt?.id} - {appt && new Date(appt.fecha).toLocaleDateString()} {appt?.hora}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 space-y-2 text-sm">
            <div className="font-medium">Preclínica</div>
            {pre ? (
              <ul className="text-sm space-y-1">
                <li>Peso: {pre.weight} kg</li>
                <li>Altura: {pre.height} cm</li>
                <li>Presión: {pre.bloodPressure}</li>
                <li>Temp: {pre.temperature} °C</li>
                <li>FC: {pre.heartRate} bpm</li>
                <li>Oxígeno: {pre.oxygenSat}%</li>
                <li>Motivo: {pre.reason}</li>
              </ul>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <Badge variant="warning">Preclínica pendiente</Badge>
                <Link href={`/dashboard/preclinica/${id}`} className="text-indigo-600 underline">Ir a Preclínica</Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 grid gap-4">
          <div>
            <label className="text-sm text-gray-600">Diagnóstico</label>
            <Textarea value={form.diagnosis} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, diagnosis: e.target.value })} disabled={!canEdit} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Tratamiento</label>
            <Textarea value={form.treatment} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, treatment: e.target.value })} disabled={!canEdit} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Notas</label>
            <Textarea value={form.notes || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })} disabled={!canEdit} />
          </div>
        </div>
        <div className="p-4 border-t flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-gray-500">Solo doctor/admin pueden editar</div>
          <div className="flex gap-2">
            {canEdit ? (
              <>
                <Button variant="outline" onClick={markAsDone} disabled={marking || !appt?.id}>Marcar realizada</Button>
                <Button onClick={onSave} disabled={saving}>Guardar consulta</Button>
              </>
            ) : (
              <span className="text-sm text-gray-500">Solo lectura</span>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b">
          <h3 className="font-medium">Consultas previas</h3>
        </div>
        <div className="p-4">
          {history.length === 0 ? (
            <div className="text-sm text-gray-500">Sin consultas anteriores</div>
          ) : (
            <ul className="space-y-3">
              {history.map((c, idx) => (
                <li key={idx} className="border rounded p-3">
                  <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()} - Dr. {c.doctor?.nombre}</div>
                  <div className="text-sm"><span className="font-medium">Dx:</span> {c.diagnosis}</div>
                  <div className="text-sm"><span className="font-medium">Tx:</span> {c.treatment}</div>
                  {c.notes && <div className="text-sm text-gray-600 dark:text-gray-300">Notas: {c.notes}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </main>
  );
}
