"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const nestjs_i18n_1 = require("nestjs-i18n");
const nestjs_1 = require("@grammyjs/nestjs");
const path = require("path");
const hikvision_module_1 = require("./modules/hikvision/hikvision.module");
const bot_module_1 = require("./modules/bot/bot.module");
const reporting_module_1 = require("./modules/reporting/reporting.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const prisma_service_1 = require("./database/prisma.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            event_emitter_1.EventEmitterModule.forRoot(),
            nestjs_i18n_1.I18nModule.forRoot({
                fallbackLanguage: 'uz',
                loaderOptions: {
                    path: path.join(__dirname, 'i18n'),
                    watch: true,
                },
                resolvers: [
                    { use: nestjs_i18n_1.QueryResolver, options: ['lang'] },
                    nestjs_i18n_1.AcceptLanguageResolver,
                    new nestjs_i18n_1.HeaderResolver(['x-custom-lang']),
                ],
            }),
            nestjs_1.NestjsGrammyModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    token: config.get('TELEGRAM_BOT_TOKEN'),
                    useWebhook: false,
                }),
            }),
            hikvision_module_1.HikvisionModule,
            bot_module_1.BotModule,
            reporting_module_1.ReportingModule,
            dashboard_module_1.DashboardModule,
        ],
        providers: [prisma_service_1.PrismaService],
        exports: [prisma_service_1.PrismaService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map