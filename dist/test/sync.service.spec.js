"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const sync_service_1 = require("../src/modules/hikvision/sync.service");
const hikvision_service_1 = require("../src/modules/hikvision/hikvision.service");
const prisma_service_1 = require("../src/database/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const late_log_event_1 = require("../src/common/events/late-log.event");
describe('SyncService', () => {
    let service;
    let hikvisionService;
    let prismaService;
    let eventEmitter;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                sync_service_1.SyncService,
                {
                    provide: hikvision_service_1.HikvisionService,
                    useValue: {
                        fetchLogs: jest.fn(),
                    },
                },
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        attendance: {
                            findFirst: jest.fn(),
                            create: jest.fn(),
                        },
                        user: {
                            findUnique: jest.fn(),
                        },
                    },
                },
                {
                    provide: event_emitter_1.EventEmitter2,
                    useValue: {
                        emit: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(sync_service_1.SyncService);
        hikvisionService = module.get(hikvision_service_1.HikvisionService);
        prismaService = module.get(prisma_service_1.PrismaService);
        eventEmitter = module.get(event_emitter_1.EventEmitter2);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('syncLogs', () => {
        it('should process on-time attendance correctly', async () => {
            const mockLog = {
                CardNo: '12345',
                EventTime: '2023-10-27T08:55:00',
                EventName: 'Access In',
                DeviceID: 1,
            };
            const mockUser = {
                id: 'user-1',
                cardNo: '12345',
                fullName: 'Test User',
                shiftStart: '09:00',
            };
            jest.spyOn(prismaService.attendance, 'findFirst').mockResolvedValue(null);
            jest.spyOn(hikvisionService, 'fetchLogs').mockResolvedValue([mockLog]);
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
            jest.spyOn(prismaService.attendance, 'create').mockResolvedValue({ id: 'att-1' });
            await service.syncLogs();
            expect(prismaService.attendance.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'user-1',
                    status: client_1.AttendanceStatus.ON_TIME,
                }),
            });
            expect(eventEmitter.emit).not.toHaveBeenCalled();
        });
        it('should detect late attendance and emit event', async () => {
            const mockLog = {
                CardNo: '12345',
                EventTime: '2023-10-27T09:10:00',
                EventName: 'Access In',
                DeviceID: 1,
            };
            const mockUser = {
                id: 'user-1',
                cardNo: '12345',
                fullName: 'Test User',
                shiftStart: '09:00',
            };
            jest.spyOn(prismaService.attendance, 'findFirst').mockResolvedValue(null);
            jest.spyOn(hikvisionService, 'fetchLogs').mockResolvedValue([mockLog]);
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
            jest.spyOn(prismaService.attendance, 'create').mockResolvedValue({ id: 'att-2' });
            await service.syncLogs();
            expect(prismaService.attendance.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'user-1',
                    status: client_1.AttendanceStatus.LATE,
                }),
            });
            expect(eventEmitter.emit).toHaveBeenCalledWith(late_log_event_1.LATE_LOG_EVENT, expect.objectContaining({
                userId: 'user-1',
                latenessMinutes: 10
            }));
        });
        it('should ignore logs for unknown users', async () => {
            const mockLog = {
                CardNo: '99999',
                EventTime: '2023-10-27T09:00:00',
                EventName: 'Access In',
                DeviceID: 1,
            };
            jest.spyOn(prismaService.attendance, 'findFirst').mockResolvedValue(null);
            jest.spyOn(hikvisionService, 'fetchLogs').mockResolvedValue([mockLog]);
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
            await service.syncLogs();
            expect(prismaService.attendance.create).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=sync.service.spec.js.map