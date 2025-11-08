import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PacientesModule } from './pacientes/pacientes.module';
import { CitasModule } from './citas/citas.module';
import { RecetasModule } from './recetas/recetas.module';
import { PagosModule } from './pagos/pagos.module';
import { AppController } from './app.controller';
import { DoctoresModule } from './doctores/doctores.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AdminModule } from './admin/admin.module';
import { PreclinicModule } from './preclinic/preclinic.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { PermissionsModule } from './permissions/permissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PacientesModule,
    CitasModule,
    RecetasModule,
    PagosModule,
    DoctoresModule,
    UsuariosModule,
    AdminModule,
    PreclinicModule,
    ConsultationsModule,
    PermissionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
