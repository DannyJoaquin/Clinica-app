#!/usr/bin/env node
// End-to-end smoke test for Clínica API
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.env.BASE_URL || 'http://localhost:3001';

async function api(path, { method = 'GET', headers = {}, body, expectJson = true } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      msg = j.message || JSON.stringify(j);
    } catch {}
    throw new Error(`${method} ${path}: ${msg}`);
  }
  if (!expectJson) return res;
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

function randSuffix() {
  return Math.floor(Math.random() * 1e9).toString(36);
}

async function main() {
  console.log('Health check...');
  const root = await api('/');
  if (!root || !root.status) throw new Error('Backend no responde correctamente');

  console.log('Login admin...');
  const login = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo: 'admin@clinica.com', contraseña: 'admin123' }),
  });
  const token = login.access_token;
  if (!token) throw new Error('No se obtuvo token');
  const auth = { Authorization: `Bearer ${token}` };

  console.log('Profile...');
  await api('/auth/profile', { headers: auth });

  console.log('Registrar doctor...');
  const email = `doctor.qa+${randSuffix()}@clinica.com`;
  const doctor = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombre: 'Dr QA', correo: email, contraseña: 'test123', rol: 'doctor' }),
  });

  console.log('Crear paciente...');
  const paciente = await api('/pacientes', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ nombreCompleto: `Paciente QA ${randSuffix()}`, fechaNacimiento: '1990-01-01', telefono: '555-1000' }),
  });

  console.log('Listar pacientes...');
  await api('/pacientes', { headers: auth });

  console.log('Crear cita...');
  const cita = await api('/citas', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ pacienteId: paciente.id, doctorId: doctor.id, fecha: new Date().toISOString(), hora: '10:00', motivoConsulta: 'Chequeo QA' }),
  });

  console.log('Actualizar cita (estado)...');
  await api(`/citas/${cita.id}`, { method: 'PUT', headers: auth, body: JSON.stringify({ estado: 'confirmada' }) });

  console.log('Crear receta...');
  const receta = await api('/recetas', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ pacienteId: paciente.id, doctorId: doctor.id, medicamentos: 'Ibuprofeno 400mg', instrucciones: 'Cada 8h' }),
  });

  console.log('Listar recetas por paciente...');
  await api(`/pacientes/${paciente.id}/recetas`, { headers: auth });

  console.log('Descargar PDF de receta...');
  const pdfRes = await api(`/recetas/${receta.id}/pdf`, { headers: auth, expectJson: false });
  const arrayBuf = await pdfRes.arrayBuffer();
  const dest = join(tmpdir(), `receta-${receta.id}-${Date.now()}.pdf`);
  await writeFile(dest, Buffer.from(arrayBuf));

  console.log('Crear pago...');
  const pago = await api('/pagos', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ pacienteId: paciente.id, citaId: cita.id, monto: 500.0, metodoPago: 'efectivo' }),
  });

  console.log('Listar pagos...');
  await api('/pagos', { headers: auth });

  console.log('OK ✅', { doctorId: doctor.id, pacienteId: paciente.id, citaId: cita.id, recetaId: receta.id, pagoId: pago.id, pdf: dest });
}

main().catch((err) => {
  console.error('E2E FAILED ❌', err?.message || err);
  process.exit(1);
});
