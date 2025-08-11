import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { User } from '@prisma/client'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() userData: CreateUserDto): Promise<User> {
    return this.userService.createUser(userData)
  }

  @Get()
  async findAllUsers(): Promise<User[]> {
    return this.userService.findAllUsers()
  }

  @Get(':id')
  async findUserById(@Param('id') id: string): Promise<User | null> {
    const userId = Number(id)
    if (isNaN(userId)) {
      throw new Error('Invalid user ID')
    }
    return this.userService.findUserById(userId)
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() userData: UpdateUserDto): Promise<User | null> {
    const userId = Number(id)
    if (isNaN(userId)) {
      throw new Error('Invalid user ID')
    }
    return this.userService.updateUser(userId, userData)
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<void> {
    const userId = Number(id)
    if (isNaN(userId)) {
      throw new Error('Invalid user ID')
    }
    await this.userService.deleteUser(userId)
  }
}
