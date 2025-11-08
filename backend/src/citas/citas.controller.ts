import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CitasService } from './citas.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CreateCitaDto, UpdateCitaDto } from '../dto/cita.dto';

@ApiTags('citas')
@Controller('citas')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CitasController {
  constructor(private readonly service: CitasService) {}

  @Get()
  @Permissions('citas.view')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('admin', 'asistente', 'doctor')
  @Permissions('citas.view')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Post()
  @Roles('admin', 'asistente', 'doctor')
  @Permissions('citas.create')
  create(@Body() body: CreateCitaDto) {
    return this.service.create(body as any);
  }

  @Put(':id')
  @Roles('admin', 'asistente', 'doctor')
  @Permissions('citas.update')
  update(@Param('id') id: string, @Body() body: UpdateCitaDto) {
    return this.service.update(Number(id), body as any);
  }

  @Delete(':id')
  @Roles('admin', 'asistente')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
