import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RecetasService } from './recetas.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateRecetaDto } from '../dto/receta.dto';

@ApiTags('recetas')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecetasController {
  constructor(private readonly service: RecetasService) {}

  @Get('recetas/:id')
  findById(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Get('pacientes/:id/recetas')
  findByPaciente(@Param('id') id: string) {
    return this.service.findByPaciente(Number(id));
  }

  @Post('recetas')
  @Roles('admin', 'doctor')
  create(@Body() body: CreateRecetaDto) {
    return this.service.create(body as any);
  }

  @Get('recetas/:id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    try {
      // Pre-check to avoid streaming setup when the receta does not exist
      const receta = await this.service.findById(Number(id));
      if (!receta) {
        return res.status(404).json({ message: 'Receta no encontrada' });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=receta-${id}.pdf`);
      const PDFKit = require('pdfkit');
      const doc = new PDFKit({ size: 'A4', margin: 50 });
      // Attach stream error handlers
      doc.on('error', (err: any) => {
        try {
          if (!res.headersSent) {
            res.status(500).json({ message: err?.message || 'PDF error' });
          } else {
            res.end();
          }
        } catch {}
      });
      doc.pipe(res);
      await this.service.poblarPdf(doc, Number(id));
      doc.end();
    } catch (e: any) {
      res.status(500).json({ message: e?.message || 'PDF error' });
    }
  }
}
