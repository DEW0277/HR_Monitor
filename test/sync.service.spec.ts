import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from '../src/modules/hikvision/sync.service';
import { HikvisionService } from '../src/modules/hikvision/hikvision.service';
import { PrismaService } from '../src/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceStatus } from "@prisma/client";    
import { LATE_LOG_EVENT } from '../src/common/events/late-log.event';

describe('SyncService', () => {
  let service: SyncService;
  let hikvisionService: HikvisionService;
  let prismaService: PrismaService;
  let eventEmitter: EventEmitter2;  

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: HikvisionService,
          useValue: {
            fetchLogs: jest.fn(),
          },
        },
        {
          provide: PrismaService,
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
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    hikvisionService = module.get<HikvisionService>(HikvisionService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncLogs', () => {
    it('should process on-time attendance correctly', async () => {
      // Mock Data
      const mockLog = {
        CardNo: '12345',
        EventTime: '2023-10-27T08:55:00', // 08:55 AM
        EventName: 'Access In',
        DeviceID: 1,
      };

      const mockUser = {
        id: 'user-1',
        cardNo: '12345',
        fullName: 'Test User',
        shiftStart: '09:00',
      };

      // Mock Implementations
      jest.spyOn(prismaService.attendance, 'findFirst').mockResolvedValue(null);
      jest.spyOn(hikvisionService, 'fetchLogs').mockResolvedValue([mockLog as any]);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.attendance, 'create').mockResolvedValue({ id: 'att-1' } as any);

      // Execute
      await service.syncLogs();

      // Verify
      expect(prismaService.attendance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          status: AttendanceStatus.ON_TIME,
        }),
      });
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should detect late attendance and emit event', async () => {
      // Mock Data: 09:10 AM (Late)
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

      // Mock Implementations
      jest.spyOn(prismaService.attendance, 'findFirst').mockResolvedValue(null);
      jest.spyOn(hikvisionService, 'fetchLogs').mockResolvedValue([mockLog as any]);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.attendance, 'create').mockResolvedValue({ id: 'att-2' } as any);

      // Execute
      await service.syncLogs();

      // Verify
      expect(prismaService.attendance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          status: AttendanceStatus.LATE,
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        LATE_LOG_EVENT,
        expect.objectContaining({
            userId: 'user-1',
            latenessMinutes: 10
        })
      );
    });

    it('should ignore logs for unknown users', async () => {
        const mockLog = {
            CardNo: '99999',
            EventTime: '2023-10-27T09:00:00',
            EventName: 'Access In',
            DeviceID: 1,
        };

        jest.spyOn(prismaService.attendance, 'findFirst').mockResolvedValue(null);
        jest.spyOn(hikvisionService, 'fetchLogs').mockResolvedValue([mockLog as any]);
        jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

        await service.syncLogs();

        expect(prismaService.attendance.create).not.toHaveBeenCalled();
    });
  });
});
