import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationDto } from '../dto/consultation.dto';

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  async getByAppointmentId(appointmentId: number) {
    const rec = await this.prisma.consultation.findUnique({
      where: { appointmentId },
      include: { patient: true, doctor: true, preclinic: true, appointment: true },
    });
    if (!rec) throw new NotFoundException('Consulta no encontrada');
    return rec;
  }

  async create(dto: CreateConsultationDto, user: { id: number; rol: string }) {
    const cita = await this.prisma.cita.findUnique({ where: { id: dto.appointmentId } });
    if (!cita) throw new NotFoundException('Cita no existe');

    // Usar siempre el doctor asignado a la cita para registrar la consulta
    const doctorId = cita.doctorId;

    // Si ya existe consulta para esta cita, actualizamos (idempotente)
    const existing = await this.prisma.consultation.findUnique({ where: { appointmentId: dto.appointmentId } });
    if (existing) {
      return this.prisma.consultation.update({
        where: { appointmentId: dto.appointmentId },
        data: {
          diagnosis: dto.diagnosis,
          treatment: dto.treatment,
          notes: dto.notes,
        },
      });
    }

    // Crear nueva consulta enlazando paciente, doctor y preclínica si existe
    const pre = await this.prisma.preclinic.findUnique({ where: { appointmentId: dto.appointmentId } });
    return this.prisma.consultation.create({
      data: {
        appointmentId: dto.appointmentId,
        patientId: cita.pacienteId,
        doctorId,
        preclinicId: pre?.id ?? null,
        diagnosis: dto.diagnosis,
        treatment: dto.treatment,
        notes: dto.notes,
      },
    });
  }

  async getByPatient(patientId: number) {
    return this.prisma.consultation.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { appointment: true, doctor: true, preclinic: true },
    });
  }
}
