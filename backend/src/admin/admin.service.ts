import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Range = '7d' | '30d' | '90d';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSummary(range: Range) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [totalPatients, appointmentsToday, totalPrescriptions, incomeSum] = await Promise.all([
      this.prisma.paciente.count(),
      this.prisma.cita.count({ where: { fecha: { gte: startOfToday, lte: endOfToday } } }),
      this.prisma.receta.count(),
      this.prisma.pago.aggregate({ _sum: { monto: true }, where: { fechaPago: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
    ]);

    // Estados en DB: 'pendiente' | 'confirmada' | 'realizada' | 'cancelada'
    const [pendiente, confirmada, realizada, cancelada] = await Promise.all([
      this.prisma.cita.count({ where: { estado: 'pendiente' } }),
      this.prisma.cita.count({ where: { estado: 'confirmada' } }),
      this.prisma.cita.count({ where: { estado: 'realizada' } }),
      this.prisma.cita.count({ where: { estado: 'cancelada' } }),
    ]);

    // Próximas del día (ordenadas por hora aproximada a partir de 'hora' string)
    const upcomingRaw = await this.prisma.cita.findMany({
      where: { fecha: { gte: startOfToday, lte: endOfToday } },
      include: { paciente: true, doctor: true },
      orderBy: { fecha: 'asc' },
      take: 10,
    });
    const upcomingAppointments = upcomingRaw.map((c) => ({
      patient: c.paciente.nombreCompleto,
      doctor: c.doctor.nombre,
      time: c.hora,
      status: this.mapStatus(c.estado),
    }));

    // Actividad reciente (simple): últimos pagos, citas, pacientes, recetas
    const [recentPagos, recentCitas, recentPacs, recentRecs] = await Promise.all([
      this.prisma.pago.findMany({ orderBy: { fechaPago: 'desc' }, take: 5 }),
      this.prisma.cita.findMany({ orderBy: { fecha: 'desc' }, take: 5, include: { paciente: true } }),
      this.prisma.paciente.findMany({ orderBy: { creadoEn: 'desc' }, take: 5 }),
      this.prisma.receta.findMany({ orderBy: { fechaEmision: 'desc' }, take: 5, include: { paciente: true } }),
    ]);

    const recentActivity = [
      ...recentPagos.map((p) => ({ type: 'payment', message: `Pago registrado de L. ${p.monto.toFixed(2)}`, timestamp: p.fechaPago.toISOString() })),
      ...recentCitas.map((c) => ({ type: 'appointment', message: `Cita actualizada para ${c.paciente?.nombreCompleto ?? '#' + c.pacienteId}`, timestamp: c.fecha.toISOString() })),
      ...recentPacs.map((p) => ({ type: 'patient', message: `Paciente agregado: ${p.nombreCompleto}`, timestamp: p.creadoEn.toISOString() })),
      ...recentRecs.map((r) => ({ type: 'prescription', message: `Receta creada para ${r.paciente?.nombreCompleto ?? '#' + r.pacienteId}`, timestamp: r.fechaEmision.toISOString() })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    // Ingresos últimos 6 meses
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const pagos = await this.prisma.pago.findMany({ where: { fechaPago: { gte: sixMonthsAgo } }, orderBy: { fechaPago: 'asc' } });
    const incomeMap = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleString('es', { month: 'short' });
      incomeMap.set(label.charAt(0).toUpperCase() + label.slice(1, 3), 0);
    }
    pagos.forEach((p) => {
      const m = p.fechaPago.toLocaleString('es', { month: 'short' });
      const key = m.charAt(0).toUpperCase() + m.slice(1, 3);
      incomeMap.set(key, (incomeMap.get(key) || 0) + p.monto);
    });
    const incomeByMonth = Array.from(incomeMap.entries()).map(([month, amount]) => ({ month, amount }));

    return {
      totalPatients,
      appointmentsToday,
      monthlyIncome: Number(incomeSum._sum.monto || 0),
      totalPrescriptions,
      appointmentsByStatus: {
        pending: pendiente,
        confirmed: confirmada,
        done: realizada,
        cancelled: cancelada,
      },
      recentActivity,
      upcomingAppointments,
      incomeByMonth,
    };
  }

  private mapStatus(s: string): 'pending' | 'confirmed' | 'done' | 'cancelled' {
    switch (s) {
      case 'pendiente':
        return 'pending';
      case 'confirmada':
        return 'confirmed';
      case 'realizada':
        return 'done';
      case 'cancelada':
      default:
        return 'cancelled';
    }
  }
}
