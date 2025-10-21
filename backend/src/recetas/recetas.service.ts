import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class RecetasService {
  constructor(private prisma: PrismaService) {}

  findById(id: number) {
    return this.prisma.receta.findUnique({ where: { id } });
  }

  async findByPaciente(pacienteId: number) {
    return this.prisma.receta.findMany({ where: { pacienteId }, orderBy: { fechaEmision: 'desc' } });
  }

  async create(data: { pacienteId: number; doctorId: number; medicamentos: string; instrucciones?: string }) {
    return this.prisma.receta.create({ data });
  }

  async generarPdf(recetaId: number): Promise<Buffer> {
    const receta = await this.prisma.receta.findUnique({
      where: { id: recetaId },
      include: { paciente: true, doctor: true },
    });
    if (!receta) throw new NotFoundException('Receta no encontrada');

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Uint8Array[] = [];
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (c: Uint8Array) => chunks.push(c));
      doc.on('error', (err) => reject(err));
      doc.on('end', () => {
        try {
          resolve(Buffer.concat(chunks.map((c) => Buffer.from(c))));
        } catch (e) {
          reject(e);
        }
      });

      // Header
      doc.fontSize(22).text('Clínica Médica', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(18).text('Receta Médica', { align: 'center' });
      doc.moveDown();

      // Datos principales
      doc.fontSize(12);
      doc.text(`Paciente: ${receta.paciente.nombreCompleto}`);
      doc.text(`Doctor: ${receta.doctor.nombre}`);
      doc.text(`Fecha: ${new Date(receta.fechaEmision).toLocaleDateString()}`);
      doc.moveDown();

      // Medicamentos
      doc.font('Helvetica-Bold').text('Medicamentos:');
      doc.font('Helvetica').text(receta.medicamentos, { align: 'left' });
      if (receta.instrucciones) {
        doc.moveDown();
        doc.font('Helvetica-Bold').text('Instrucciones:');
        doc.font('Helvetica').text(receta.instrucciones);
      }
      doc.end();
    });
  }

  async generarPdfStream(recetaId: number): Promise<PDFKit.PDFDocument> {
    const receta = await this.prisma.receta.findUnique({
      where: { id: recetaId },
      include: { paciente: true, doctor: true },
    });
    if (!receta) throw new NotFoundException('Receta no encontrada');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.fontSize(22).text('Clínica Médica', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(18).text('Receta Médica', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Paciente: ${receta.paciente.nombreCompleto}`);
    doc.text(`Doctor: ${receta.doctor.nombre}`);
    doc.text(`Fecha: ${new Date(receta.fechaEmision).toLocaleDateString()}`);
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Medicamentos:');
    doc.font('Helvetica').text(receta.medicamentos);
    if (receta.instrucciones) {
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Instrucciones:');
      doc.font('Helvetica').text(receta.instrucciones);
    }
    return doc;
  }

  async poblarPdf(doc: PDFKit.PDFDocument, recetaId: number): Promise<void> {
    const receta = await this.prisma.receta.findUnique({
      where: { id: recetaId },
      include: { paciente: true, doctor: true },
    });
    if (!receta) throw new NotFoundException('Receta no encontrada');

    doc.fontSize(22).text('Clínica Médica', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(18).text('Receta Médica', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Paciente: ${receta.paciente.nombreCompleto}`);
    doc.text(`Doctor: ${receta.doctor.nombre}`);
    doc.text(`Fecha: ${new Date(receta.fechaEmision).toLocaleDateString()}`);
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Medicamentos:');
    doc.font('Helvetica').text(receta.medicamentos);
    if (receta.instrucciones) {
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Instrucciones:');
      doc.font('Helvetica').text(receta.instrucciones);
    }
  }
}
