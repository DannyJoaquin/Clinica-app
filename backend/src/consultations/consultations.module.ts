import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';

@Module({
  controllers: [ConsultationsController],
  providers: [PrismaService, ConsultationsService],
})
export class ConsultationsModule {}
