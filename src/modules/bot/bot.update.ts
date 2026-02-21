import { Bot, Context, Keyboard } from 'grammy';
import { InjectBot, Update, Start, On, Ctx } from '@grammyjs/nestjs';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../database/prisma.service';
import { PhoneNumberNormalizer } from '../../common/utils/phone-normalizer';
import { OnEvent } from '@nestjs/event-emitter';
import { LATE_LOG_EVENT, LateLogEvent } from '../../common/events/late-log.event';

export const pendingLanguages = new Map<number, string>();
export const pendingLateness = new Map<number, string>();

@Update()
export class BotUpdate {
	constructor(
		@InjectBot() private readonly bot: Bot<Context>,
		private readonly i18n: I18nService,
		private readonly prisma: PrismaService,
	) {}

	@Start()
	async onStart(@Ctx() ctx: Context) {
		const keyboard = new Keyboard().text("🇺🇿 O'zbekcha").text('🇷🇺 Русский').resized();

		await ctx.reply('Tilni tanlang / Выберите язык', {
			reply_markup: keyboard,
		});
	}

	@On('message:text')
	async onMessage(@Ctx() ctx: Context) {
		const text = ctx.message?.text;
		const lang = text === "🇺🇿 O'zbekcha" ? 'uz' : text === '🇷🇺 Русский' ? 'ru' : null;

		if (lang && ctx.from) {
			pendingLanguages.set(ctx.from.id, lang);
			const message = this.i18n.t('bot.share_contact', { lang });
			const buttonText = this.i18n.t('bot.contact_button', { lang });

			const keyboard = new Keyboard().requestContact(buttonText).resized();

			await ctx.reply(message, { reply_markup: keyboard });
			return;
		}

		const userId = ctx.from?.id;
		if (userId && pendingLateness.has(userId)) {
			const attendanceId = pendingLateness.get(userId);
			const reason = text;

			if (reason && attendanceId) {
				await this.prisma.attendance.update({
					where: { id: attendanceId },
					data: { latenessReason: reason },
				});

				pendingLateness.delete(userId);
				await ctx.reply('👍 ok');
				return;
			}
		}
	}

	// BU YERDA XATO BOR EDI: 'contact' -> 'message:contact' ga o'zgartirildi
	@On('message:contact')
	async onContact(@Ctx() ctx: Context) {
		const contact = ctx.message?.contact;
		if (!contact) return;

		const phone = contact.phone_number;
		const normalizedPhone = PhoneNumberNormalizer.normalize(phone);
		const userId = ctx.from?.id;

		const user = await this.prisma.user.findFirst({
			where: { phoneNumber: normalizedPhone },
		});

		if (user && userId) {
			const lang = pendingLanguages.get(userId) || 'UZ';

			await this.prisma.user.update({
				where: { id: user.id },
				data: {
					telegramId: BigInt(userId),
					language: lang === 'ru' ? 'RU' : 'UZ',
				},
			});

			const successMsg = this.i18n.t('bot.registered', { lang });
			await ctx.reply(successMsg, { reply_markup: { remove_keyboard: true } });

			pendingLanguages.delete(userId);
		} else if (userId) {
			const lang = pendingLanguages.get(userId) || 'uz';
			const errorMsg = this.i18n.t('bot.user_not_found', { lang });
			await ctx.reply(errorMsg, { reply_markup: { remove_keyboard: true } });
		}
	}

	@OnEvent(LATE_LOG_EVENT)
	async onLateLog(payload: LateLogEvent) {
		const { userId, latenessMinutes, attendanceId } = payload;

		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user || !user.telegramId) return;

		const lang = user.language === 'RU' ? 'ru' : 'uz';
		const message = this.i18n.t('bot.ask_lateness_reason', {
			lang,
			args: { minutes: latenessMinutes },
		});

		try {
			await this.bot.api.sendMessage(Number(user.telegramId), message, {
				reply_markup: { force_reply: true },
			});
			pendingLateness.set(Number(user.telegramId), attendanceId);
		} catch (e) {
			console.error('Failed to send message to user', e);
		}
	}
}
