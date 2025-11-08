import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from '../dto/doctor.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DoctoresService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.usuario.findMany({
      where: { rol: 'doctor' },
      select: { id: true, nombre: true, correo: true, rol: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async create(data: CreateDoctorDto) {
    const exists = await this.prisma.usuario.findUnique({ where: { correo: data.correo } });
    if (exists) throw new BadRequestException('Correo ya registrado');
    const hash = await bcrypt.hash(data.contrasena, 10);
    return this.prisma.usuario.create({
      data: { nombre: data.nombre, correo: data.correo, contrasena: hash, rol: 'doctor' },
      select: { id: true, nombre: true, correo: true, rol: true },
    });
  }

  async remove(id: number) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user || user.rol !== 'doctor') throw new NotFoundException('Doctor no encontrado');
    await this.prisma.usuario.delete({ where: { id } });
    return { ok: true };
  }

  async getById(id: number) {
    const doc = await this.prisma.usuario.findUnique({ where: { id } });
    if (!doc || doc.rol !== 'doctor') throw new NotFoundException('Doctor no encontrado');
    return { id: doc.id, nombre: doc.nombre, correo: doc.correo, rol: doc.rol };
  }
}
