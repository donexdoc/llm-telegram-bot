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

  // Новый метод для обработки команды /activate
  async activate(ctx: Context, secretWord: string) {
    if (!ctx.from?.id) {
      return ctx.reply('Сорян, не могу тебя идентифицировать!')
    }

    const correctSecretWord = process.env.SECRET_WORD

    const user = await this.userService.createOrUpdate({
      telegramId: ctx.from.id.toString(),
      username: ctx.from.username,
    })

    if (!correctSecretWord) {
      throw new Error('SECRET_WORD is not defined')
    }

    if (secretWord !== correctSecretWord) {
      return ctx.reply('Неверное секретное слово! Пример команды - <code>/activate секретное_слово</code>', {
        parse_mode: 'HTML',
      })
    }

    await this.userService.updateUser(user.id, { isActive: true })

    if (user) {
      return ctx.reply('Аккаунт успешно активирован!')
    } else {
      return ctx.reply('Не удалось активировать аккаунт.')
    }
  }
}
