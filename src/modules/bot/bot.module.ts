import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [BotUpdate, PrismaService],
})
export class BotModule {}
