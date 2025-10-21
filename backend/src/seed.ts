import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin
  const adminCorreo = 'admin@clinica.com';
  const existingAdmin = await prisma.usuario.findUnique({ where: { correo: adminCorreo } });
  if (!existingAdmin) {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.usuario.create({
      data: { nombre: 'Administrador', correo: adminCorreo, contrasena: hash, rol: 'admin' },
    });
    console.log('Usuario admin creado:', adminCorreo, 'contraseña: admin123');
  } else {
    console.log('Usuario admin ya existe.');
  }

  // Doctor
  const doctorCorreo = 'doctor@clinica.com';
  const existingDoctor = await prisma.usuario.findUnique({ where: { correo: doctorCorreo } });
  if (!existingDoctor) {
    const hash = await bcrypt.hash('doctor123', 10);
    await prisma.usuario.create({
      data: { nombre: 'Dr Demo', correo: doctorCorreo, contrasena: hash, rol: 'doctor' },
    });
    console.log('Usuario doctor creado:', doctorCorreo, 'contraseña: doctor123');
  } else {
    console.log('Usuario doctor ya existe.');
  }

  // Asistente
  const asistenteCorreo = 'asistente@clinica.com';
  const existingAsistente = await prisma.usuario.findUnique({ where: { correo: asistenteCorreo } });
  if (!existingAsistente) {
    const hash = await bcrypt.hash('asistente123', 10);
    await prisma.usuario.create({
      data: { nombre: 'Asistente Demo', correo: asistenteCorreo, contrasena: hash, rol: 'asistente' },
    });
    console.log('Usuario asistente creado:', asistenteCorreo, 'contraseña: asistente123');
  } else {
    console.log('Usuario asistente ya existe.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
