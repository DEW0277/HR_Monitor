import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { I18nModule, QueryResolver, AcceptLanguageResolver, HeaderResolver } from 'nestjs-i18n';
import { NestjsGrammyModule } from '@grammyjs/nestjs';
import * as path from 'path';

// Loyiha modullari
import { HikvisionModule } from './modules/hikvision/hikvision.module';
import { BotModule } from './modules/bot/bot.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PrismaService } from './database/prisma.service';

@Module({
	imports: [
		// 1. Konfiguratsiya (isGlobal: true - barcha modullarda ishlatish uchun)
		ConfigModule.forRoot({
			isGlobal: true,
		}),

		// 2. Hodisalar boshqaruvi (Internal Events)
		EventEmitterModule.forRoot(),

		// 3. Ko'p tilli tizim (I18n)
		I18nModule.forRoot({
			fallbackLanguage: 'uz',
			loaderOptions: {
				// __dirname dist ichida bo'lgani uchun yo'lni xavfsiz birlashtiramiz
				path: path.join(__dirname, 'i18n'),
				watch: true,
			},
			resolvers: [
				{ use: QueryResolver, options: ['lang'] }, // ?lang=uz
				AcceptLanguageResolver, // Brauzer tiliga qarab
				new HeaderResolver(['x-custom-lang']), // Header orqali
			],
		}),

		// 4. Telegram Bot (Grammy)
		NestjsGrammyModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				token: config.get<string>('TELEGRAM_BOT_TOKEN'),
				useWebhook: false, // Local va oddiy serverlar uchun long polling
			}),
		}),

		// 5. Biznes modullar
		HikvisionModule,
		BotModule,
		ReportingModule,
		DashboardModule,
	],
	providers: [PrismaService],
	exports: [PrismaService], // Boshqa modullar ishlatishi uchun
})
export class AppModule {}
