import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(): Promise<{
        total: number;
        present: number;
        onTime: number;
        late: number;
        absent: number;
    }>;
    getUsers(): Promise<{
        id: string;
        fullName: string;
        status: "ON_TIME" | "LATE" | "ABSENT";
        checkTime: any;
        latenessReason: any;
    }[]>;
}
