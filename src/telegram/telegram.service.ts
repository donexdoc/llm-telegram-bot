import { Injectable } from '@nestjs/common'
import { UserService } from 'src/user/user.service'
import { Context } from 'telegraf'

@Injectable()
export class TelegramService {
  constructor(private readonly userService: UserService) {}

  async start(ctx: Context) {
    if (!ctx.from?.id) {
      return ctx.reply('Сорян, не могу тебя идентифицировать!')
    }

    const user = await this.userService.createOrUpdate({
      telegramId: ctx.from.id.toString(),
      username: ctx.from.username,
    })

    return ctx.reply(`Привет, ${user.username || user.telegramId}! Я бот. Напиши /help, чтобы увидеть команды.`)
  }

  async help(ctx: Context) {
    return ctx.reply(['Доступные команды:', '/start — запуск', '/help — справка'].join('\n'))
  }

  async fallback(ctx: Context, text?: string) {
    return ctx.reply(text || 'Заготовленный ответ на любое сообщение.')
  }
}
