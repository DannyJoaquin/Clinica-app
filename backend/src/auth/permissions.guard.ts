import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private permsService: PermissionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { rol?: string } | undefined;
    const role = user?.rol;
    if (!role) return false;

    // Admin bypass (opcional): los admin siempre pueden
    if (role === 'admin') return true;

    const rolePerms = await this.permsService.listRolePermissions(role);
    const keys = new Set<string>(rolePerms.map((rp: any) => rp.permission?.key || rp.key));
    return required.every((k) => keys.has(k));
  }
}
