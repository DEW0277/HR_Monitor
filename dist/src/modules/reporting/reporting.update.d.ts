import { Context } from 'grammy';
import { ReportingService } from './reporting.service';
export declare class ReportingUpdate {
    private readonly reportingService;
    constructor(reportingService: ReportingService);
    onForceReport(ctx: Context): Promise<void>;
}
