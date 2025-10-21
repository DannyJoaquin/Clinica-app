export interface Paciente {
  id: number;
  nombreCompleto: string;
  fechaNacimiento: string; // ISO string
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  antecedentes?: string | null;
  creadoEn: string;
}

export type PacienteInput = Omit<Paciente, 'id' | 'creadoEn'>;

// ---- Citas ----
export interface Cita {
  id: number;
  pacienteId: number;
  doctorId: number;
  fecha: string; // ISO date string (YYYY-MM-DD or ISO)
  hora: string; // HH:mm
  motivoConsulta?: string | null;
  estado: string; // pendiente | confirmada | realizada | cancelada (libre)
  notas?: string | null;
}

export type CitaInput = Omit<Cita, 'id'>;

// ---- Recetas ----
export interface Receta {
  id: number;
  pacienteId: number;
  doctorId: number;
  fechaEmision: string; // ISO
  medicamentos: string;
  instrucciones?: string | null;
}

export type RecetaInput = Omit<Receta, 'id' | 'fechaEmision'>;

// ---- Pagos ----
export interface Pago {
  id: number;
  pacienteId: number;
  citaId?: number | null;
  monto: number;
  metodoPago: string; // efectivo | tarjeta | transferencia (libre)
  fechaPago: string; // ISO
}

export type PagoInput = Omit<Pago, 'id' | 'fechaPago'>;

// ---- Usuario (perfil mínimo) ----
export interface UsuarioProfile {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

// ---- Doctor (subset de Usuario) ----
export interface Doctor {
  id: number;
  nombre: string;
  correo: string;
  rol: 'doctor';
}
