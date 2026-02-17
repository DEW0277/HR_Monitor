import { HikvisionService } from './hikvision.service';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class SyncService {
    private readonly hikvisionService;
    private readonly prisma;
    private readonly eventEmitter;
    private readonly logger;
    constructor(hikvisionService: HikvisionService, prisma: PrismaService, eventEmitter: EventEmitter2);
    syncLogs(): Promise<void>;
}
