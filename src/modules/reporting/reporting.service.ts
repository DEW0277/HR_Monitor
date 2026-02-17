import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { InjectBot } from '@grammyjs/nestjs';
import { Bot, Context } from 'grammy';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);
  private readonly MANAGEMENT_GROUP_ID = process.env.MANAGEMENT_GROUP_ID;

  constructor(
    private readonly prisma: PrismaService,
    @InjectBot() private readonly bot: Bot<Context>,
  ) {}

  @Cron('0 10 * * *', { timeZone: 'Asia/Tashkent' })
  async handleDailyReport() {
    this.logger.log('Starting daily report generation...');
    await this.generateAndSendReport();
  }

  async generateAndSendReport() {
    if (!this.MANAGEMENT_GROUP_ID) {
      this.logger.error('MANAGEMENT_GROUP_ID is not set in environment variables.');
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Fetch all attendance logs for today
      const logs = await this.prisma.attendance.findMany({
        where: {
          checkTime: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          user: true,
        },
      });

      // Fetch all active users to find who is absent (optional, but good for completeness)
      // For now, consistent with requirements, we focus on On Time vs Late based on logs.
      // Ideally we should check shift schedules, but let's stick to the generated logs.

      const onTime = logs.filter((log) => log.status === AttendanceStatus.ON_TIME);
      const late = logs.filter((log) => log.status === AttendanceStatus.LATE);

      // Unique users count (in case of multiple scans)
      // We can take the first scan of the day as the status usually.
      // But let's assume the SyncService handles deduplication or we just list events.
      // Better: Group by user?
      // Requirement says "Aggregate... grouped by branch".
      // We don't have "Branch" in User model yet (checked schema).
      // Assuming global report or "Default Branch".

      const reportUz = this.formatReport(onTime, late, 'UZ');
      const reportRu = this.formatReport(onTime, late, 'RU');

      await this.bot.api.sendMessage(this.MANAGEMENT_GROUP_ID, reportUz, { parse_mode: 'HTML' });
      await this.bot.api.sendMessage(this.MANAGEMENT_GROUP_ID, reportRu, { parse_mode: 'HTML' });

      this.logger.log('Daily report sent successfully.');
    } catch (error) {
      this.logger.error('Failed to send daily report', error);
    }
  }

  private formatReport(onTime: any[], late: any[], lang: 'UZ' | 'RU'): string {
    const isUz = lang === 'UZ';
    const dateStr = new Date().toLocaleDateString(isUz ? 'uz-UZ' : 'ru-RU');
    
    let message = isUz 
      ? `📊 <b>Hisobot (${dateStr})</b>\n\n`
      : `📊 <b>Отчет (${dateStr})</b>\n\n`;

    // On Time Section
    message += isUz ? '✅ <b>Vaqtida kelganlar:</b>\n' : '✅ <b>Пришли вовремя:</b>\n';
    if (onTime.length === 0) {
      message += isUz ? '— Hech kim\n' : '— Никого\n';
    } else {
      const uniqueOnTime = [...new Map(onTime.map(item => [item.user.id, item])).values()];
      uniqueOnTime.forEach((log) => {
        message += `👤 ${log.user.fullName || log.user.phoneNumber}\n`;
      });
    }
    message += '\n';

    // Late Section
    message += isUz ? '⚠️ <b>Kechikkanlar:</b>\n' : '⚠️ <b>Опоздавшие:</b>\n';
    if (late.length === 0) {
      message += isUz ? '— Hech kim\n' : '— Никого\n';
    } else {
      const uniqueLate = [...new Map(late.map(item => [item.user.id, item])).values()];
      uniqueLate.forEach((log) => {
        const reason = log.latenessReason ? `\n   <i>${isUz ? 'Sabab' : 'Причина'}: ${log.latenessReason}</i>` : '';
        const time = new Date(log.checkTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        message += `👤 ${log.user.fullName || log.user.phoneNumber} (${time}) ${reason}\n`;
      });
    }

    return message;
  }
}
