import { Module } from '@nestjs/common';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PagosController],
  providers: [PagosService, PrismaService],
})
export class PagosModule {}
