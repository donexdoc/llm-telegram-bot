// src/ollama/ollama.service.ts
import { Injectable, HttpException } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { AxiosError } from 'axios'
import { lastValueFrom } from 'rxjs'

type OllamaOptions = Record<string, unknown>

interface OllamaChatMessage {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  role: 'system' | 'user' | 'assistant' | string
  content: string
}

interface OllamaChatResponse {
  model: string
  created_at: string
  message: OllamaChatMessage
  done: boolean
  // доп. поля у разных версий Ollama могут отличаться
  [key: string]: unknown
}

@Injectable()
export class OllamaService {
  private readonly baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
  private readonly timeoutMs = 60_000

  constructor(private readonly http: HttpService) {}

  /**
   * Делает один чат-запрос к Ollama и возвращает текст ответа ассистента.
   * Подходит для сценария "получил сообщение из Telegram -> отправил в LLM -> вернул строку".
   */
  async reply(model: string, userText: string, options?: OllamaOptions, signal?: AbortSignal): Promise<string> {
    try {
      const url = `${this.baseUrl}/api/chat`
      const body = {
        model,
        stream: false,
        messages: [{ role: 'user', content: userText } satisfies OllamaChatMessage],
        options, // можно прокидывать temperature, num_ctx и т.п.
      }

      const res = await lastValueFrom(
        this.http.post<OllamaChatResponse>(url, body, {
          timeout: this.timeoutMs,
          signal,
        }),
      )

      const content = res.data?.message?.content?.trim() ?? ''
      return content
    } catch (err) {
      this.handleAxiosError(err)
    }
  }

  private handleAxiosError(err: unknown): never {
    if ((err as AxiosError).isAxiosError) {
      const ax = err as AxiosError<any>
      const status = ax.response?.status ?? 502
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const detail = ax.response?.data ?? ax.message ?? 'Unknown error'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      throw new HttpException({ message: 'Ollama request failed', detail }, status)
    }
    throw err as Error
  }
}
