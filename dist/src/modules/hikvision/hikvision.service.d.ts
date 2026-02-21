import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface HikvisionLog {
    DeviceID: number;
    CardNo: string;
    EventTime: Date;
    EventName: string;
}
export declare class HikvisionService implements OnModuleInit {
    private configService;
    private readonly logger;
    private pool;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    connectWithRetry(retries?: number, delay?: number): Promise<void>;
    fetchLogs(lastSyncTime: Date): Promise<HikvisionLog[]>;
}
