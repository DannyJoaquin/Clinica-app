import { Module } from '@nestjs/common';
import { DoctoresController } from './doctores.controller';
import { DoctoresService } from './doctores.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DoctoresController],
  providers: [DoctoresService, PrismaService],
  exports: [DoctoresService],
})
export class DoctoresModule {}
