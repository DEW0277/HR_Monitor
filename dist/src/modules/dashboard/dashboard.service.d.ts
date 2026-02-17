import { PrismaService } from '../../database/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDailyStats(): Promise<{
        total: number;
        present: number;
        onTime: number;
        late: number;
        absent: number;
    }>;
    getUsersList(): Promise<{
        id: string;
        fullName: string;
        status: "ON_TIME" | "LATE" | "ABSENT";
        checkTime: any;
        latenessReason: any;
    }[]>;
}
