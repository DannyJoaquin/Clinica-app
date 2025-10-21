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
  ],
  controllers: [AppController],
})
export class AppModule {}
