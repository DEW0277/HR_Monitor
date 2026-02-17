import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportingService } from './reporting.service';
import { PrismaService } from '../../database/prisma.service';
import { ReportingUpdate } from './reporting.update';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [ReportingService, ReportingUpdate, PrismaService],
})
export class ReportingModule {}
