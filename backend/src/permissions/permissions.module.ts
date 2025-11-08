import { Global, Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard } from '../auth/permissions.guard';

@Global()
@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, PrismaService, PermissionsGuard],
  exports: [PermissionsService, PermissionsGuard],
})
export class PermissionsModule {}
