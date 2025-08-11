import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { PrismaService } from 'nestjs-prisma'

@Module({
  providers: [UserService, PrismaService],
  controllers: [UserController],
})
export class UserModule {}
