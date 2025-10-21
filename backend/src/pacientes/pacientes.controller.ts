import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PacientesService } from './pacientes.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreatePacienteDto, UpdatePacienteDto } from '../dto/paciente.dto';

@ApiTags('pacientes')
@Controller('pacientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PacientesController {
  constructor(private readonly service: PacientesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Post()
  @Roles('admin', 'asistente', 'doctor')
  create(@Body() body: CreatePacienteDto) {
    return this.service.create(body as any);
  }

  @Put(':id')
  @Roles('admin', 'asistente', 'doctor')
  update(@Param('id') id: string, @Body() body: UpdatePacienteDto) {
    return this.service.update(Number(id), body as any);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
