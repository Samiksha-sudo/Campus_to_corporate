import { AnthropicProvider } from './AnthropicProvider.js'
import type { AIProvider }   from './AIProvider.js'
import { env }               from '../../config/env.js'

let _aiProvider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (!_aiProvider) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY in .env')
    }
    _aiProvider = new AnthropicProvider()
  }
  return _aiProvider
}

export type { AIProvider, AIMessage, AICompletionOptions, AICompletionResult } from './AIProvider.js'
