import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PreclinicService } from './preclinic.service';
import { PreclinicController } from './preclinic.controller';

@Module({
  controllers: [PreclinicController],
  providers: [PrismaService, PreclinicService],
})
export class PreclinicModule {}
