import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(data: { nombre: string; correo: string; contraseña?: string; contrasena?: string; rol: 'admin' | 'doctor' | 'asistente' }) {
    const existing = await this.prisma.usuario.findUnique({ where: { correo: data.correo } });
    if (existing) throw new BadRequestException('El correo ya está registrado');
    const pwd = data.contraseña ?? data.contrasena;
    if (!pwd) throw new BadRequestException('La contraseña es obligatoria');
    const hash = await bcrypt.hash(pwd, 10);
    const user = await this.prisma.usuario.create({
      data: { nombre: data.nombre, correo: data.correo, contrasena: hash, rol: data.rol },
    });
    return { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol };
  }

  async login(data: { correo: string; contraseña?: string; contrasena?: string }) {
    const user = await this.prisma.usuario.findUnique({ where: { correo: data.correo } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const pwd = data.contraseña ?? data.contrasena;
    if (!pwd) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(pwd, user.contrasena);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    const payload = { sub: user.id, rol: user.rol, nombre: user.nombre, correo: user.correo };
    const token = await this.jwt.signAsync(payload);
    return { access_token: token, user: { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol } };
  }
}
