import { Module } from '@nestjs/common';
import { HikvisionService } from './hikvision.service';
import { SyncService } from './sync.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [HikvisionService, SyncService, PrismaService],
  exports: [HikvisionService, SyncService],
})
export class HikvisionModule {}
