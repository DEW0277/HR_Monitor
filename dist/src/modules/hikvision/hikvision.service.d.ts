export interface HikvisionLog {
    DeviceID: number;
    CardNo: string;
    EventTime: Date;
    EventName: string;
}
export declare class HikvisionService {
    private readonly logger;
    private pool;
    constructor();
    connectWithRetry(retries?: number, delay?: number): Promise<void>;
    fetchLogs(lastSyncTime: Date): Promise<HikvisionLog[]>;
}
