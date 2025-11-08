import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertPreclinicDto, CreateWalkinPreclinicDto } from '../dto/preclinic.dto';

@Injectable()
export class PreclinicService {
  constructor(private prisma: PrismaService) {}

  async getByAppointmentId(appointmentId: number) {
    const rec = await this.prisma.preclinic.findUnique({ where: { appointmentId } });
    if (!rec) throw new NotFoundException('Preclínica no encontrada');
    return rec;
  }

  async upsert(dto: UpsertPreclinicDto) {
    // Validar que exista la cita
    const cita = await this.prisma.cita.findUnique({ where: { id: dto.appointmentId } });
    if (!cita) throw new NotFoundException('Cita no existe');
    // upsert por appointmentId (único)
    return this.prisma.preclinic.upsert({
      where: { appointmentId: dto.appointmentId },
      update: {
        weight: dto.weight,
        height: dto.height,
        bloodPressure: dto.bloodPressure,
        temperature: dto.temperature,
        heartRate: dto.heartRate,
        oxygenSat: dto.oxygenSat,
        reason: dto.reason,
        notes: dto.notes,
      },
      create: ({
        appointmentId: dto.appointmentId,
        patientId: cita.pacienteId,
        weight: dto.weight,
        height: dto.height,
        bloodPressure: dto.bloodPressure,
        temperature: dto.temperature,
        heartRate: dto.heartRate,
        oxygenSat: dto.oxygenSat,
        reason: dto.reason,
        notes: dto.notes,
      } as unknown) as any,
    });
  }

  async createWalkin(dto: CreateWalkinPreclinicDto) {
    // Walk-in preclínica: crea registro sin cita y asigna doctor creando una Cita inmediatamente
    // Validar paciente y doctor
    const [patient, doctor] = await Promise.all([
      this.prisma.paciente.findUnique({ where: { id: dto.patientId } }),
      this.prisma.usuario.findUnique({ where: { id: dto.doctorId } }),
    ]);
    if (!patient) throw new NotFoundException('Paciente no existe');
    if (!doctor) throw new NotFoundException('Doctor no existe');

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const hora = `${hh}:${mm}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const pre = await tx.preclinic.create({
        data: ({
          patientId: dto.patientId,
          weight: dto.weight,
          height: dto.height,
          bloodPressure: dto.bloodPressure,
          temperature: dto.temperature,
          heartRate: dto.heartRate,
          oxygenSat: dto.oxygenSat,
          reason: dto.reason,
          notes: dto.notes,
        } as unknown) as any,
      });

      const cita = await tx.cita.create({
        data: {
          pacienteId: dto.patientId,
          doctorId: dto.doctorId,
          fecha: now,
          hora,
          motivoConsulta: dto.reason,
          estado: 'pendiente',
          // No se puede conectar preclinic desde Cita (FK vive en Preclinic), luego actualizamos Preclinic
        },
      });

      const preUpdated = await tx.preclinic.update({
        where: { id: pre.id },
        data: { appointmentId: cita.id },
      });

      return { preclinic: preUpdated, appointment: cita };
    });

    // Devuelve la preclínica con appointmentId para que el front redirija a Consulta
    return result.preclinic;
  }
}

