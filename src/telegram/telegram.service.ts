import { Injectable } from '@nestjs/common'
import { Context } from 'telegraf'

@Injectable()
export class TelegramService {
  async start(ctx: Context) {
    return ctx.reply('Привет! Я бот. Напиши /help, чтобы увидеть команды.')
  }

  async help(ctx: Context) {
    return ctx.reply(['Доступные команды:', '/start — запуск', '/help — справка'].join('\n'))
  }

  async fallback(ctx: Context, text?: string) {
    return ctx.reply(text || 'Заготовленный ответ на любое сообщение.')
  }
}
