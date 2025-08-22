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
  [key: string]: unknown
}

@Injectable()
export class OllamaService {
  private readonly baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
  private readonly timeoutMs = 60_000

  /** Жёсткое ограничение длины под Telegram (есть запас под форматирование). */
  private static readonly MAX_CHARS = 3800

  /** «Быстрый» пресет для ускорения и упрощения ответов. */
  private static readonly FAST_PRESET: OllamaOptions = {
    // Ограничение генерации
    num_predict: 260, // максимум токенов ответа
    num_ctx: 2048, // не раздуваем контекст
    // Упрощённая/быстрая выборка
    temperature: 0.7,
    top_k: 40,
    top_p: 0.9,
    repeat_penalty: 1.05,
    // Ранние остановки (часто завершает на пустой строке/перед новым ходом)
    stop: ['\n\n', 'User:', 'Пользователь:'],
  }

  /** Короткая системная инструкция — «пиши проще и короче». */
  private static readonly SYSTEM_BRIEF: OllamaChatMessage = {
    role: 'system',
    content:
      'Отвечай максимально кратко (до 6–8 предложений), простыми словами, без лишней разметки и прелюдий. ' +
      'Сначала дай суть, затем 3–5 лаконичных пунктов, если уместно. Не повторяй вопрос.',
  }

  constructor(private readonly http: HttpService) {}

  /**
   * Делает один чат-запрос к Ollama и возвращает текст ответа ассистента.
   * Ограничения:
   *  - жёсткий быстрый пресет (можно перекрыть частично своим `options`)
   *  - короткая системная инструкция
   *  - обрезка под лимит Telegram
   */
  async reply(model: string, userText: string, options?: OllamaOptions, signal?: AbortSignal): Promise<string> {
    try {
      const url = `${this.baseUrl}/api/chat`

      // Сливаем опции: сначала быстрый пресет, сверху — пользовательские (если есть)
      const mergedOptions: OllamaOptions = {
        ...OllamaService.FAST_PRESET,
        ...(options ?? {}),
      }

      const body = {
        model,
        stream: false,
        messages: [OllamaService.SYSTEM_BRIEF, { role: 'user', content: userText } as OllamaChatMessage],
        options: mergedOptions,
      }

      const res = await lastValueFrom(
        this.http.post<OllamaChatResponse>(url, body, {
          timeout: this.timeoutMs,
          signal,
        }),
      )

      let content = (res.data?.message?.content ?? '').trim()

      // Жёстко обрезаем по символам под Telegram
      if (content.length > OllamaService.MAX_CHARS) {
        // стараемся не резать слово посередине, если недалеко есть пробел/перевод строки
        const soft = content.lastIndexOf(' ', OllamaService.MAX_CHARS)
        const softNl = content.lastIndexOf('\n', OllamaService.MAX_CHARS)
        const cut = Math.max(soft, softNl)
        content = content.slice(0, cut > OllamaService.MAX_CHARS * 0.7 ? cut : OllamaService.MAX_CHARS).trimEnd()
        content += '…'
      }

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
