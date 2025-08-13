// src/ollama/ollama.module.ts
import { Module } from '@nestjs/common'
import { OllamaService } from './ollama.service'
import { HttpModule } from '@nestjs/axios'

@Module({
  imports: [HttpModule],
  providers: [OllamaService],
  exports: [OllamaService],
})
export class OllamaModule {}
