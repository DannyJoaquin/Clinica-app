import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateUsuarioDto, UpdateUsuarioDto } from '../dto/usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.usuario.findMany({ orderBy: { id: 'asc' } });
  }

  async create(data: CreateUsuarioDto) {
    const hash = await bcrypt.hash(data.contrasena, 10);
    return this.prisma.usuario.create({ data: { nombre: data.nombre, correo: data.correo, rol: data.rol, contrasena: hash } });
  }

  async update(id: number, data: UpdateUsuarioDto) {
    const existing = await this.prisma.usuario.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Usuario no encontrado');
    let contrasena = undefined as string | undefined;
    if (data.contrasena) contrasena = await bcrypt.hash(data.contrasena, 10);
    return this.prisma.usuario.update({
      where: { id },
      data: {
        nombre: data.nombre ?? undefined,
        correo: data.correo ?? undefined,
        rol: data.rol ?? undefined,
        contrasena,
      },
    });
  }

  async remove(id: number) {
    await this.prisma.usuario.delete({ where: { id } });
    return { ok: true };
  }
}
