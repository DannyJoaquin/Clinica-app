import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DoctoresService } from './doctores.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateDoctorDto } from '../dto/doctor.dto';

@ApiTags('doctores')
@Controller('doctores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctoresController {
  constructor(private readonly service: DoctoresService) {}

  @Get()
  async list() {
    return this.service.list();
  }

  @Post()
  @Roles('admin')
  async create(@Body() body: CreateDoctorDto) {
    return this.service.create(body);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
