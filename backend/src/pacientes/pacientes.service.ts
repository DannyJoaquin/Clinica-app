import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PacientesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.paciente.findMany({ orderBy: { id: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.paciente.findUnique({ where: { id } });
  }

  async create(data: {
    nombreCompleto: string;
    fechaNacimiento: Date | string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    antecedentes?: string;
  }) {
    // Normalizar fechaNacimiento en caso de venir como string (YYYY-MM-DD)
    const fecha = new Date(data.fechaNacimiento as any);
    if (isNaN(fecha.getTime())) {
      throw new BadRequestException('fechaNacimiento inválida');
    }
    return this.prisma.paciente.create({
      data: {
        nombreCompleto: data.nombreCompleto,
        fechaNacimiento: fecha,
        telefono: data.telefono,
        correo: data.correo,
        direccion: data.direccion,
        antecedentes: data.antecedentes,
      },
    });
  }

  async update(
    id: number,
    data: Partial<{
      nombreCompleto: string;
      fechaNacimiento: Date | string;
      telefono?: string;
      correo?: string;
      direccion?: string;
      antecedentes?: string;
    }>,
  ) {
    const exists = await this.prisma.paciente.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Paciente no encontrado');
    const payload: any = { ...data };
    if (payload.fechaNacimiento !== undefined) {
      const fecha = new Date(payload.fechaNacimiento as any);
      if (isNaN(fecha.getTime())) {
        throw new BadRequestException('fechaNacimiento inválida');
      }
      payload.fechaNacimiento = fecha;
    }
    return this.prisma.paciente.update({ where: { id }, data: payload });
  }

  async remove(id: number) {
    await this.prisma.paciente.delete({ where: { id } });
    return { ok: true };
  }
}
