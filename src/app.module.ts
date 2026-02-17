import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { I18nModule, QueryResolver, AcceptLanguageResolver, HeaderResolver } from 'nestjs-i18n';
import { NestjsGrammyModule } from '@grammyjs/nestjs';
import * as path from 'path';

import { HikvisionModule } from './modules/hikvision/hikvision.module';
import { BotModule } from './modules/bot/bot.module';
import { PrismaService } from './database/prisma.service';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { ReportingModule } from './modules/reporting/reporting.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    I18nModule.forRoot({
      fallbackLanguage: 'uz',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-custom-lang']),
      ],
    }),
    NestjsGrammyModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN || 'MISSING_TOKEN',
      useWebhook: false, // Long polling for simplicity
    }),
    HikvisionModule,
    BotModule,
    ReportingModule,
    DashboardModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
