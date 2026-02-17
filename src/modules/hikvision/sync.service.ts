import { Injectable, Logger } from '@nestjs/common';
import { HikvisionService, HikvisionLog } from './hikvision.service';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LATE_LOG_EVENT, LateLogEvent } from '../../common/events/late-log.event';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly hikvisionService: HikvisionService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async syncLogs() {
    this.logger.log('Starting log synchronization...');

    // 1. Get the last synced log time or default to 24 hours ago
    const lastLog = await this.prisma.attendance.findFirst({
      orderBy: { checkTime: 'desc' },
    });

    const lastSyncTime = lastLog ? lastLog.checkTime : new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 2. Fetch new logs from Hikvision
    const newLogs = await this.hikvisionService.fetchLogs(lastSyncTime);
    this.logger.log(`Fetched ${newLogs.length} new logs from Hikvision.`);

    if (newLogs.length === 0) return;

    // 3. Process and Save
    let successCount = 0;
    for (const log of newLogs) {
      try {
        const checkTime = new Date(log.EventTime);
        
        // Find user by CardNo
        const user = await this.prisma.user.findUnique({
          where: { cardNo: log.CardNo },
        });

        if (!user) {
          this.logger.warn(`Unknown CardNo: ${log.CardNo} at ${log.EventTime}`);
          continue;
        }

        // Determine Status (On Time / Late)
        const [shiftHour, shiftMinute] = user.shiftStart.split(':').map(Number);
        const shiftTime = new Date(checkTime);
        shiftTime.setHours(shiftHour, shiftMinute, 0, 0);

        let status: AttendanceStatus = AttendanceStatus.ON_TIME;
        let latenessMinutes = 0;

        // Simple logic: If checkTime > shiftTime + 5 mins grace period => LATE
        if (checkTime > new Date(shiftTime.getTime() + 5 * 60000)) {
           status = AttendanceStatus.LATE;
           latenessMinutes = Math.floor((checkTime.getTime() - shiftTime.getTime()) / 60000);
        }

        // Create Attendance Record
        const attendance = await this.prisma.attendance.create({
          data: {
            userId: user.id,
            checkTime: checkTime,
            type: log.EventName.includes('In') ? 'ENTER' : 'LEAVE', // Simplified logic
            status: status,
            deviceIp: String(log.DeviceID),
          },
        });

        this.logger.log(`Logged attendance for ${user.fullName || user.id}: ${status}`);

        // Emit Event if Late
        if (status === AttendanceStatus.LATE) {
            this.eventEmitter.emit(
                LATE_LOG_EVENT,
                new LateLogEvent(user.id, latenessMinutes, attendance.id),
            );
        }
        
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to process log for CardNo ${log.CardNo}`, error);
      }
    }

    this.logger.log(`Sync complete. Processed ${successCount} logs.`);
  }
}
