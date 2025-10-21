import { Module } from '@nestjs/common';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CitasController],
  providers: [CitasService, PrismaService],
})
export class CitasModule {}
