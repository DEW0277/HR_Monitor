import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const logs = await this.prisma.attendance.findMany({
      where: {
        checkTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const totalEmployees = await this.prisma.user.count();
    
    // Group by user to get unique status per person for the day (simplification)
    // We'll take the "worst" status if multiple logs exist (LATE > ON_TIME), or just count raw logs if logic permits.
    // For now, let's count unique users in logs.
    const presentUserIds = new Set(logs.map(l => l.userId));
    
    // Counters
    let onTime = 0;
    let late = 0;

    // We can iterate the logs or find unique logs
    const uniqueLogs = new Map<string, AttendanceStatus>();
    
    logs.forEach(log => {
        if (!uniqueLogs.has(log.userId)) {
            uniqueLogs.set(log.userId, log.status);
        } else {
            // If already has a status, override if LATE (prioritize highlighting issues)
            if (log.status === AttendanceStatus.LATE) {
                uniqueLogs.set(log.userId, AttendanceStatus.LATE);
            }
        }
    });

    uniqueLogs.forEach(status => {
        if (status === AttendanceStatus.ON_TIME) onTime++;
        if (status === AttendanceStatus.LATE) late++;
    });

    const absent = totalEmployees - presentUserIds.size;

    return {
      total: totalEmployees,
      present: presentUserIds.size,
      onTime,
      late,
      absent: absent < 0 ? 0 : absent, // Safety check
    };
  }

  async getUsersList() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const users = await this.prisma.user.findMany({
        include: {
            attendances: {
                where: {
                    checkTime: {
                        gte: today,
                        lt: tomorrow
                    }
                },
                orderBy: { checkTime: 'asc' }
            }
        }
    });

    return users.map(user => {
        const firstLog = user.attendances[0];
        let status: 'ABSENT' | 'ON_TIME' | 'LATE' = 'ABSENT';
        let checkTime = null;
        let latenessReason = null;

        if (firstLog) {
            status = firstLog.status === AttendanceStatus.LATE ? 'LATE' : 'ON_TIME';
            checkTime = firstLog.checkTime;
            latenessReason = firstLog.latenessReason;
        }

        return {
            id: user.id,
            fullName: user.fullName || user.phoneNumber, // Fallback
            status,
            checkTime,
            latenessReason
        };
    });
  }
}
