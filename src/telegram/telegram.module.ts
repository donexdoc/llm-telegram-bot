// src/telegram/telegram.module.ts
import { Module } from '@nestjs/common'
import { TelegrafModule } from 'nestjs-telegraf'

import { TelegramUpdate } from './telegram.update'
import { TelegramService } from './telegram.service'
import { UserModule } from 'src/user/user.module'
import { OllamaModule } from 'src/ollama/ollama.module'

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      useFactory() {
        const token = process.env.TELEGRAM_BOT_TOKEN
        if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not defined')
        return {
          token,
          launchOptions: { dropPendingUpdates: true },
        }
      },
    }),
    UserModule,
    OllamaModule,
  ],
  providers: [TelegramUpdate, TelegramService],
})
export class TelegramModule {}
