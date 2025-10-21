import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PagosService } from './pagos.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreatePagoDto } from '../dto/pago.dto';

@ApiTags('pagos')
@Controller('pagos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagosController {
  constructor(private readonly service: PagosService) {}

  @Get()
  @Roles('admin', 'asistente')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('admin', 'asistente')
  create(@Body() body: CreatePagoDto) {
    return this.service.create(body as any);
  }
}
