import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'
import { PrismaService } from 'nestjs-prisma'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({ data })
  }

  async findAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany()
  }

  async findUserById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    })
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<User | null> {
    return this.prisma.user.update({
      where: {
        id,
      },
      data,
    })
  }

  async deleteUser(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id,
      },
    })
  }

  // Новый метод для поиска или создания пользователя
  // реализация от qewn2.5-coder
  // async findOrCreateUser(telegramId: string, username?: string): Promise<User> {
  //   const existingUser = await this.prisma.user.findUnique({
  //     where: { telegramId },
  //   })

  //   if (existingUser) {
  //     return existingUser
  //   }

  //   return this.createUser({ telegramId, username })
  // }

  // более гибкая реализация с обновлением данных пользователя ( username может меняться )
  async createOrUpdate(data: CreateUserDto) {
    return this.prisma.user.upsert({
      where: {
        telegramId: data.telegramId,
      },
      update: data,
      create: data,
    })
  }
}
