import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    await this.ensureSqliteDevSchema();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureSqliteDevSchema() {
    try {
      const url = process.env.DATABASE_URL || '';
      const isSqlite = url.startsWith('file:');
      if (!isSqlite) return;

      // Ensure Preclinic has patientId column for walk-in flow
      const columns: Array<{ name: string }> = await this.$queryRawUnsafe(
        'PRAGMA table_info("Preclinic");'
      );
      const hasPatientId = columns.some((c) => c.name === 'patientId');
      if (!hasPatientId) {
        await this.$executeRawUnsafe('ALTER TABLE "Preclinic" ADD COLUMN "patientId" INTEGER;');
      }

      // Optionally ensure recordedById exists (safe no-op if unused)
      const hasRecordedById = columns.some((c) => c.name === 'recordedById');
      if (!hasRecordedById) {
        await this.$executeRawUnsafe('ALTER TABLE "Preclinic" ADD COLUMN "recordedById" INTEGER;');
      }
    } catch (e) {
      // Best-effort alignment for dev; don't block app startup
      console.warn('[PrismaService] SQLite dev schema ensure skipped or failed:', (e as Error)?.message);
    }
  }
}
