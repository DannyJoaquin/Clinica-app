import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PreclinicService } from './preclinic.service';
import { UpsertPreclinicDto, CreateWalkinPreclinicDto } from '../dto/preclinic.dto';

@ApiTags('preclinic')
@Controller('preclinic')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class PreclinicController {
  constructor(private readonly service: PreclinicService) {}

  @Get(':appointmentId')
  @Roles('admin', 'doctor', 'asistente')
  @Permissions('preclinic.view')
  get(@Param('appointmentId') appointmentId: string) {
    return this.service.getByAppointmentId(Number(appointmentId));
  }

  @Post()
  @Roles('admin', 'asistente')
  @Permissions('preclinic.upsert')
  create(@Body() body: UpsertPreclinicDto) {
    return this.service.upsert(body);
  }

  @Post('walkin')
  @Roles('admin', 'asistente')
  @Permissions('preclinic.upsert')
  createWalkin(@Body() body: CreateWalkinPreclinicDto) {
    return this.service.createWalkin(body);
  }

  @Put(':appointmentId')
  @Roles('admin', 'asistente')
  @Permissions('preclinic.upsert')
  update(@Param('appointmentId') appointmentId: string, @Body() body: UpsertPreclinicDto) {
    return this.service.upsert({ ...body, appointmentId: Number(appointmentId) });
  }
}
