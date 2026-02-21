"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotUpdate = exports.pendingLateness = exports.pendingLanguages = void 0;
const grammy_1 = require("grammy");
const nestjs_1 = require("@grammyjs/nestjs");
const nestjs_i18n_1 = require("nestjs-i18n");
const prisma_service_1 = require("../../database/prisma.service");
const phone_normalizer_1 = require("../../common/utils/phone-normalizer");
const event_emitter_1 = require("@nestjs/event-emitter");
const late_log_event_1 = require("../../common/events/late-log.event");
exports.pendingLanguages = new Map();
exports.pendingLateness = new Map();
let BotUpdate = class BotUpdate {
    constructor(bot, i18n, prisma) {
        this.bot = bot;
        this.i18n = i18n;
        this.prisma = prisma;
    }
    async onStart(ctx) {
        const keyboard = new grammy_1.Keyboard().text("🇺🇿 O'zbekcha").text('🇷🇺 Русский').resized();
        await ctx.reply('Tilni tanlang / Выберите язык', {
            reply_markup: keyboard,
        });
    }
    async onMessage(ctx) {
        const text = ctx.message?.text;
        const lang = text === "🇺🇿 O'zbekcha" ? 'uz' : text === '🇷🇺 Русский' ? 'ru' : null;
        if (lang && ctx.from) {
            exports.pendingLanguages.set(ctx.from.id, lang);
            const message = this.i18n.t('bot.share_contact', { lang });
            const buttonText = this.i18n.t('bot.contact_button', { lang });
            const keyboard = new grammy_1.Keyboard().requestContact(buttonText).resized();
            await ctx.reply(message, { reply_markup: keyboard });
            return;
        }
        const userId = ctx.from?.id;
        if (userId && exports.pendingLateness.has(userId)) {
            const attendanceId = exports.pendingLateness.get(userId);
            const reason = text;
            if (reason && attendanceId) {
                await this.prisma.attendance.update({
                    where: { id: attendanceId },
                    data: { latenessReason: reason },
                });
                exports.pendingLateness.delete(userId);
                await ctx.reply('👍 ok');
                return;
            }
        }
    }
    async onContact(ctx) {
        const contact = ctx.message?.contact;
        if (!contact)
            return;
        const phone = contact.phone_number;
        const normalizedPhone = phone_normalizer_1.PhoneNumberNormalizer.normalize(phone);
        const userId = ctx.from?.id;
        const user = await this.prisma.user.findFirst({
            where: { phoneNumber: normalizedPhone },
        });
        if (user && userId) {
            const lang = exports.pendingLanguages.get(userId) || 'UZ';
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    telegramId: BigInt(userId),
                    language: lang === 'ru' ? 'RU' : 'UZ',
                },
            });
            const successMsg = this.i18n.t('bot.registered', { lang });
            await ctx.reply(successMsg, { reply_markup: { remove_keyboard: true } });
            exports.pendingLanguages.delete(userId);
        }
        else if (userId) {
            const lang = exports.pendingLanguages.get(userId) || 'uz';
            const errorMsg = this.i18n.t('bot.user_not_found', { lang });
            await ctx.reply(errorMsg, { reply_markup: { remove_keyboard: true } });
        }
    }
    async onLateLog(payload) {
        const { userId, latenessMinutes, attendanceId } = payload;
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.telegramId)
            return;
        const lang = user.language === 'RU' ? 'ru' : 'uz';
        const message = this.i18n.t('bot.ask_lateness_reason', {
            lang,
            args: { minutes: latenessMinutes },
        });
        try {
            await this.bot.api.sendMessage(Number(user.telegramId), message, {
                reply_markup: { force_reply: true },
            });
            exports.pendingLateness.set(Number(user.telegramId), attendanceId);
        }
        catch (e) {
            console.error('Failed to send message to user', e);
        }
    }
};
exports.BotUpdate = BotUpdate;
__decorate([
    (0, nestjs_1.Start)(),
    __param(0, (0, nestjs_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [grammy_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onStart", null);
__decorate([
    (0, nestjs_1.On)('message:text'),
    __param(0, (0, nestjs_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [grammy_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onMessage", null);
__decorate([
    (0, nestjs_1.On)('message:contact'),
    __param(0, (0, nestjs_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [grammy_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onContact", null);
__decorate([
    (0, event_emitter_1.OnEvent)(late_log_event_1.LATE_LOG_EVENT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [late_log_event_1.LateLogEvent]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onLateLog", null);
exports.BotUpdate = BotUpdate = __decorate([
    (0, nestjs_1.Update)(),
    __param(0, (0, nestjs_1.InjectBot)()),
    __metadata("design:paramtypes", [grammy_1.Bot,
        nestjs_i18n_1.I18nService,
        prisma_service_1.PrismaService])
], BotUpdate);
//# sourceMappingURL=bot.update.js.map