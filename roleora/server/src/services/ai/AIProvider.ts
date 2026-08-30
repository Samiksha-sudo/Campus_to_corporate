export interface AIMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface AICompletionOptions {
  model?:      string
  maxTokens?:  number
  temperature?: number
  systemPrompt?: string
}

export interface AICompletionResult {
  text:         string
  inputTokens:  number
  outputTokens: number
}

export interface AIProvider {
  complete(messages: AIMessage[], opts?: AICompletionOptions): Promise<AICompletionResult>
}
