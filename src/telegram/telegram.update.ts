// src/telegram/telegram.update.ts
import { Ctx, Message, Start, Command, Update, On } from 'nestjs-telegraf'
import { Context } from 'telegraf'
import { TelegramService } from './telegram.service'

@Update()
export class TelegramUpdate {
  constructor(private readonly telegramService: TelegramService) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.telegramService.start(ctx)
  }

  @Command('help')
  async onHelp(@Ctx() ctx: Context) {
    await this.telegramService.help(ctx)
  }

  // Новая команда /activate
  @Command('activate')
  async onActivate(@Ctx() ctx: Context, @Message('text') text: string) {
    const secretWord = text.split('/activate ')[1]
    await this.telegramService.activate(ctx, secretWord)
  }

  @On('text')
  async onAnyText(@Ctx() ctx: Context, @Message('text') text: string) {
    await this.telegramService.processMessage(ctx, text)
  }
}
