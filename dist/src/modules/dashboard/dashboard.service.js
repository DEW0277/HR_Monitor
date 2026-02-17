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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
        const presentUserIds = new Set(logs.map(l => l.userId));
        let onTime = 0;
        let late = 0;
        const uniqueLogs = new Map();
        logs.forEach(log => {
            if (!uniqueLogs.has(log.userId)) {
                uniqueLogs.set(log.userId, log.status);
            }
            else {
                if (log.status === client_1.AttendanceStatus.LATE) {
                    uniqueLogs.set(log.userId, client_1.AttendanceStatus.LATE);
                }
            }
        });
        uniqueLogs.forEach(status => {
            if (status === client_1.AttendanceStatus.ON_TIME)
                onTime++;
            if (status === client_1.AttendanceStatus.LATE)
                late++;
        });
        const absent = totalEmployees - presentUserIds.size;
        return {
            total: totalEmployees,
            present: presentUserIds.size,
            onTime,
            late,
            absent: absent < 0 ? 0 : absent,
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
            let status = 'ABSENT';
            let checkTime = null;
            let latenessReason = null;
            if (firstLog) {
                status = firstLog.status === client_1.AttendanceStatus.LATE ? 'LATE' : 'ON_TIME';
                checkTime = firstLog.checkTime;
                latenessReason = firstLog.latenessReason;
            }
            return {
                id: user.id,
                fullName: user.fullName || user.phoneNumber,
                status,
                checkTime,
                latenessReason
            };
        });
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map