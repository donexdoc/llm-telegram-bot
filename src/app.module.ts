import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from 'nestjs-prisma'
import { TelegramModule } from './telegram/telegram.module'

@Module({
  imports: [PrismaModule.forRoot(), TelegramModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
