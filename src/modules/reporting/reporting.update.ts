import { UseFilters, UseGuards } from '@nestjs/common';
import { Command, Ctx, Update } from '@grammyjs/nestjs';
import { Context } from 'grammy';
import { ReportingService } from './reporting.service';

@Update()
export class ReportingUpdate {
  constructor(private readonly reportingService: ReportingService) {}

  @Command('force_report')
  async onForceReport(@Ctx() ctx: Context) {
    // Optional: Add admin check here
    const userId = ctx.from?.id;
    if (!userId) return;

    // For now, allow anyone who knows the command or restrict to a specific ID if needed.
    // Ideally check against an admin list.
    
    await ctx.reply('Generating daily report...');
    await this.reportingService.generateAndSendReport();
    await ctx.reply('Report sent to management group.');
  }
}
