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
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const hikvision_service_1 = require("./hikvision.service");
const prisma_service_1 = require("../../database/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const late_log_event_1 = require("../../common/events/late-log.event");
const client_1 = require("@prisma/client");
let SyncService = SyncService_1 = class SyncService {
    constructor(hikvisionService, prisma, eventEmitter) {
        this.hikvisionService = hikvisionService;
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(SyncService_1.name);
    }
    async syncLogs() {
        this.logger.log('Starting log synchronization...');
        const lastLog = await this.prisma.attendance.findFirst({
            orderBy: { checkTime: 'desc' },
        });
        const lastSyncTime = lastLog ? lastLog.checkTime : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const newLogs = await this.hikvisionService.fetchLogs(lastSyncTime);
        this.logger.log(`Fetched ${newLogs.length} new logs from Hikvision.`);
        if (newLogs.length === 0)
            return;
        let successCount = 0;
        for (const log of newLogs) {
            try {
                const checkTime = new Date(log.EventTime);
                const user = await this.prisma.user.findUnique({
                    where: { cardNo: log.CardNo },
                });
                if (!user) {
                    this.logger.warn(`Unknown CardNo: ${log.CardNo} at ${log.EventTime}`);
                    continue;
                }
                const [shiftHour, shiftMinute] = user.shiftStart.split(':').map(Number);
                const shiftTime = new Date(checkTime);
                shiftTime.setHours(shiftHour, shiftMinute, 0, 0);
                let status = client_1.AttendanceStatus.ON_TIME;
                let latenessMinutes = 0;
                if (checkTime > new Date(shiftTime.getTime() + 5 * 60000)) {
                    status = client_1.AttendanceStatus.LATE;
                    latenessMinutes = Math.floor((checkTime.getTime() - shiftTime.getTime()) / 60000);
                }
                const attendance = await this.prisma.attendance.create({
                    data: {
                        userId: user.id,
                        checkTime: checkTime,
                        type: log.EventName.includes('In') ? 'ENTER' : 'LEAVE',
                        status: status,
                        deviceIp: String(log.DeviceID),
                    },
                });
                this.logger.log(`Logged attendance for ${user.fullName || user.id}: ${status}`);
                if (status === client_1.AttendanceStatus.LATE) {
                    this.eventEmitter.emit(late_log_event_1.LATE_LOG_EVENT, new late_log_event_1.LateLogEvent(user.id, latenessMinutes, attendance.id));
                }
                successCount++;
            }
            catch (error) {
                this.logger.error(`Failed to process log for CardNo ${log.CardNo}`, error);
            }
        }
        this.logger.log(`Sync complete. Processed ${successCount} logs.`);
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hikvision_service_1.HikvisionService,
        prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], SyncService);
//# sourceMappingURL=sync.service.js.map