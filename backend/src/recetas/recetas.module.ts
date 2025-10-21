import { Module } from '@nestjs/common';
import { RecetasController } from './recetas.controller';
import { RecetasService } from './recetas.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RecetasController],
  providers: [RecetasService, PrismaService],
})
export class RecetasModule {}
