"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ReportingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../database/prisma.service");
const nestjs_1 = require("@grammyjs/nestjs");
const grammy_1 = require("grammy");
const client_1 = require("@prisma/client");
let ReportingService = ReportingService_1 = class ReportingService {
    constructor(prisma, bot) {
        this.prisma = prisma;
        this.bot = bot;
        this.logger = new common_1.Logger(ReportingService_1.name);
        this.MANAGEMENT_GROUP_ID = process.env.MANAGEMENT_GROUP_ID;
    }
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
            const onTime = logs.filter((log) => log.status === client_1.AttendanceStatus.ON_TIME);
            const late = logs.filter((log) => log.status === client_1.AttendanceStatus.LATE);
            const reportUz = this.formatReport(onTime, late, 'UZ');
            const reportRu = this.formatReport(onTime, late, 'RU');
            await this.bot.api.sendMessage(this.MANAGEMENT_GROUP_ID, reportUz, { parse_mode: 'HTML' });
            await this.bot.api.sendMessage(this.MANAGEMENT_GROUP_ID, reportRu, { parse_mode: 'HTML' });
            this.logger.log('Daily report sent successfully.');
        }
        catch (error) {
            this.logger.error('Failed to send daily report', error);
        }
    }
    formatReport(onTime, late, lang) {
        const isUz = lang === 'UZ';
        const dateStr = new Date().toLocaleDateString(isUz ? 'uz-UZ' : 'ru-RU');
        let message = isUz
            ? `📊 <b>Hisobot (${dateStr})</b>\n\n`
            : `📊 <b>Отчет (${dateStr})</b>\n\n`;
        message += isUz ? '✅ <b>Vaqtida kelganlar:</b>\n' : '✅ <b>Пришли вовремя:</b>\n';
        if (onTime.length === 0) {
            message += isUz ? '— Hech kim\n' : '— Никого\n';
        }
        else {
            const uniqueOnTime = [...new Map(onTime.map(item => [item.user.id, item])).values()];
            uniqueOnTime.forEach((log) => {
                message += `👤 ${log.user.fullName || log.user.phoneNumber}\n`;
            });
        }
        message += '\n';
        message += isUz ? '⚠️ <b>Kechikkanlar:</b>\n' : '⚠️ <b>Опоздавшие:</b>\n';
        if (late.length === 0) {
            message += isUz ? '— Hech kim\n' : '— Никого\n';
        }
        else {
            const uniqueLate = [...new Map(late.map(item => [item.user.id, item])).values()];
            uniqueLate.forEach((log) => {
                const reason = log.latenessReason ? `\n   <i>${isUz ? 'Sabab' : 'Причина'}: ${log.latenessReason}</i>` : '';
                const time = new Date(log.checkTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                message += `👤 ${log.user.fullName || log.user.phoneNumber} (${time}) ${reason}\n`;
            });
        }
        return message;
    }
};
exports.ReportingService = ReportingService;
__decorate([
    (0, schedule_1.Cron)('0 10 * * *', { timeZone: 'Asia/Tashkent' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportingService.prototype, "handleDailyReport", null);
exports.ReportingService = ReportingService = ReportingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, nestjs_1.InjectBot)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        grammy_1.Bot])
], ReportingService);
//# sourceMappingURL=reporting.service.js.map