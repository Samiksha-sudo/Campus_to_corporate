import Anthropic from '@anthropic-ai/sdk'
import { env }   from '../../config/env.js'
import type { AIProvider, AIMessage, AICompletionOptions, AICompletionResult } from './AIProvider.js'

export class AnthropicProvider implements AIProvider {
  private readonly client: Anthropic

  constructor() {
    if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set')
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  }

  async complete(messages: AIMessage[], opts: AICompletionOptions = {}): Promise<AICompletionResult> {
    const response = await this.client.messages.create({
      model:      opts.model ?? env.AI_MODEL,
      max_tokens: opts.maxTokens ?? 4096,
      ...(opts.systemPrompt && { system: opts.systemPrompt }),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    return {
      text:         textBlock?.type === 'text' ? textBlock.text : '',
      inputTokens:  response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    }
  }
}
