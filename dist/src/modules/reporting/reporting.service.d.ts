import { PrismaService } from '../../database/prisma.service';
import { Bot, Context } from 'grammy';
export declare class ReportingService {
    private readonly prisma;
    private readonly bot;
    private readonly logger;
    private readonly MANAGEMENT_GROUP_ID;
    constructor(prisma: PrismaService, bot: Bot<Context>);
    handleDailyReport(): Promise<void>;
    generateAndSendReport(): Promise<void>;
    private formatReport;
}
