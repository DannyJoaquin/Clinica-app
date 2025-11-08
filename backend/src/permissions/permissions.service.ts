import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  listPermissions() {
    return (this.prisma as any).permission.findMany({ orderBy: { key: 'asc' } });
  }

  async createPermission(data: { key: string; name?: string }) {
    const key = data.key.trim();
    if (!key) throw new BadRequestException('Key requerida');
    const exists = await (this.prisma as any).permission.findUnique({ where: { key } });
    if (exists) throw new BadRequestException('Permiso ya existe');
    return (this.prisma as any).permission.create({ data: { key, name: data.name } });
  }

  async deletePermission(id: number) {
    await (this.prisma as any).rolePermission.deleteMany({ where: { permissionId: id } });
    await (this.prisma as any).permission.delete({ where: { id } });
    return { ok: true };
  }

  listRolePermissions(role: string) {
    return (this.prisma as any).rolePermission.findMany({
      where: { role },
      include: { permission: true },
      orderBy: { permission: { key: 'asc' } },
    });
  }

  async grant(role: string, permissionId: number) {
    // Validate permission exists
    const perm = await (this.prisma as any).permission.findUnique({ where: { id: permissionId } });
    if (!perm) throw new NotFoundException('Permiso no encontrado');
    // Upsert mapping
    await (this.prisma as any).rolePermission.upsert({
      where: { role_permissionId: { role, permissionId } },
      update: {},
      create: { role, permissionId },
    });
    return { ok: true };
  }

  async revoke(role: string, permissionId: number) {
    await (this.prisma as any).rolePermission.deleteMany({ where: { role, permissionId } });
    return { ok: true };
  }
}
