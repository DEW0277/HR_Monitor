import { Bot, Context } from 'grammy';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../database/prisma.service';
import { LateLogEvent } from '../../common/events/late-log.event';
export declare const pendingLanguages: Map<number, string>;
export declare const pendingLateness: Map<number, string>;
export declare class BotUpdate {
    private readonly bot;
    private readonly i18n;
    private readonly prisma;
    constructor(bot: Bot<Context>, i18n: I18nService, prisma: PrismaService);
    onStart(ctx: Context): Promise<void>;
    onMessage(ctx: Context): Promise<void>;
    onContact(ctx: Context): Promise<void>;
    onLateLog(payload: LateLogEvent): Promise<void>;
}
