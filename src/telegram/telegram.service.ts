import { Injectable, Logger } from '@nestjs/common'
import { OllamaService } from 'src/ollama/ollama.service'
import { UserService } from 'src/user/user.service'
import { Context } from 'telegraf'

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name)

  constructor(
    private readonly userService: UserService,
    private readonly ollamaService: OllamaService,
  ) {}

  async start(ctx: Context) {
    if (!ctx.from?.id) {
      return ctx.reply('Прошу прощения, не могу вас идентифицировать!')
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
      return ctx.reply('Прошу прощения, не могу вас идентифицировать!')
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

  async processMessage(ctx: Context, text: string) {
    // утилита "печатает..."
    const startTyping = () => {
      const chatId = ctx.chat?.id
      if (!chatId) return () => {}
      ctx.telegram
        .sendChatAction(chatId, 'typing')
        .catch((e) => this.logger.debug(`sendChatAction (init) failed: ${String(e)}`))
      const timer = setInterval(() => {
        ctx.telegram
          .sendChatAction(chatId, 'typing')
          .catch((e) => this.logger.debug(`sendChatAction (tick) failed: ${String(e)}`))
      }, 4000)
      return () => clearInterval(timer)
    }

    try {
      if (!ctx.from?.id) {
        return ctx.reply('Прошу прощения, не могу вас идентифицировать!')
      }

      const user = await this.userService.createOrUpdate({
        telegramId: ctx.from.id.toString(),
        username: ctx.from.username,
      })

      if (!user.isActive) {
        return ctx.reply('Прошу прощения, не могу обработать ваш запрос. Требуется активация аккаунта.')
      }

      const model = process.env.OLLAMA_MODEL_NAME || ''
      if (!model) {
        return ctx.reply('Конфигурационная ошибка: не задан OLLAMA_MODEL_NAME.')
      }

      const userText = text

      // 1) мгновенный отклик + "печатает..."
      const stopTyping = startTyping()
      const processingMsg = await ctx.reply('🤖 Обрабатываю ваш запрос…')

      // 2) запрос к LLM
      const response = await this.ollamaService.reply(model, userText)

      // 3) выключаем "печатает..."
      stopTyping()

      // 4) обновляем placeholder на финальный ответ
      try {
        await ctx.telegram.editMessageText(
          processingMsg.chat.id,
          processingMsg.message_id,
          undefined,
          response,
          // если решите включить Markdown, экранируйте спецсимволы:
          // { parse_mode: 'MarkdownV2' }
        )
      } catch (editErr) {
        this.logger.debug(`editMessageText failed, fallback to reply: ${String(editErr)}`)
        await ctx.reply(response)
        try {
          await ctx.deleteMessage(processingMsg.message_id)
        } catch (delErr) {
          this.logger.debug(`deleteMessage (placeholder) failed: ${String(delErr)}`)
        }
      }
    } catch (error) {
      this.logger.error('Error processing message', error)
      try {
        await ctx.reply('Прошу прощения, произошла ошибка при обработке вашего запроса.')
      } catch (notifyErr) {
        this.logger.debug(`Failed to send error notification: ${String(notifyErr)}`)
      }
    }
  }
}
