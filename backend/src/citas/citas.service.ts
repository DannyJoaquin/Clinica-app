import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CitasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.cita.findMany({ orderBy: { fecha: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.cita.findUnique({ where: { id } });
  }

  async create(data: { pacienteId: number; doctorId: number; fecha: Date; hora: string; motivoConsulta?: string; estado?: string; notas?: string }) {
    return this.prisma.cita.create({ data });
  }

  async update(id: number, data: Partial<{ pacienteId: number; doctorId: number; fecha: Date; hora: string; motivoConsulta?: string; estado?: string; notas?: string }>) {
    const exists = await this.prisma.cita.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Cita no encontrada');
    return this.prisma.cita.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.prisma.cita.delete({ where: { id } });
    return { ok: true };
  }
}
