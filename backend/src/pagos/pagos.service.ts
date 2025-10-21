import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PagosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.pago.findMany({ orderBy: { fechaPago: 'desc' } });
  }

  create(data: { pacienteId: number; citaId?: number; monto: number; metodoPago: string }) {
    return this.prisma.pago.create({ data });
  }
}
