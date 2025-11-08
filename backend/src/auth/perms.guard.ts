import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMS_KEY } from './perms.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPerms = this.reflector.getAllAndOverride<string[]>(PERMS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPerms || requiredPerms.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { rol?: string } | undefined;
    if (!user?.rol) return false;

    // Admin siempre permitido
    if (user.rol === 'admin') return true;

    const role = user.rol;
    const perms = await (this.prisma as any).rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });
    const have = new Set((perms as any[]).map((rp: any) => rp.permission.key));
    return requiredPerms.every((p) => have.has(p));
  }
}
