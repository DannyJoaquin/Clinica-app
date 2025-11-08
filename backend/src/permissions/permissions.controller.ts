import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PermissionsService } from './permissions.service';

@ApiTags('admin-permissions')
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  list() {
    return this.service.listPermissions();
  }

  @Post()
  create(@Body() body: { key: string; name?: string }) {
    return this.service.createPermission(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.deletePermission(Number(id));
  }

  @Get('role/:role')
  roleList(@Param('role') role: string) {
    return this.service.listRolePermissions(role);
  }

  @Post('role/:role/grant')
  grant(@Param('role') role: string, @Body() body: { permissionId: number }) {
    return this.service.grant(role, Number(body.permissionId));
  }

  @Post('role/:role/revoke')
  revoke(@Param('role') role: string, @Body() body: { permissionId: number }) {
    return this.service.revoke(role, Number(body.permissionId));
  }
}
