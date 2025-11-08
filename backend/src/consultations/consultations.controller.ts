import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from '../dto/consultation.dto';

@ApiTags('consultations')
@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ConsultationsController {
  constructor(private readonly service: ConsultationsService) {}

  @Get(':appointmentId')
  @Roles('admin', 'doctor')
  @Permissions('consulta.view')
  get(@Param('appointmentId') appointmentId: string) {
    return this.service.getByAppointmentId(Number(appointmentId));
  }

  @Post()
  @Roles('admin', 'doctor')
  @Permissions('consulta.create')
  create(@Body() body: CreateConsultationDto, @Req() req: any) {
    return this.service.create(body, req.user);
  }

  @Get('patient/:patientId')
  @Roles('admin', 'doctor')
  @Permissions('consulta.view')
  byPatient(@Param('patientId') patientId: string) {
    return this.service.getByPatient(Number(patientId));
  }
}
