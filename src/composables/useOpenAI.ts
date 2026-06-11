import { ref, computed } from 'vue'
import type { Message } from '../types'

// OpenAI API configuration
const OPENAI_API_KEY = ref('')
const OPENAI_MODEL = ref('gpt-3.5-turbo')

export const useOpenAI = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const setApiKey = (key: string) => {
    OPENAI_API_KEY.value = key
  }

  const setModel = (model: string) => {
    OPENAI_MODEL.value = model
  }

  const hasApiKey = computed(() => OPENAI_API_KEY.value.length > 0)

  const sendMessage = async (messages: Message[]): Promise<string> => {
    if (!OPENAI_API_KEY.value) {
      throw new Error('OpenAI API key not configured')
    }

    isLoading.value = true
    error.value = null

    try {
      // Use proxy server to avoid CORS
      const response = await fetch('http://localhost:3001/proxy/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: OPENAI_API_KEY.value,
          model: OPENAI_MODEL.value,
          messages: messages.map(m => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.content
          })),
          temperature: 1,
          max_tokens: 2048,
          stream: false
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error?.message || `API Error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || 'No response'
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    hasApiKey,
    setApiKey,
    setModel,
    sendMessage
  }
}

// Simulated responses (fallback when no API key)
const simulatedResponses: Record<string, string> = {
  greeting: "Hello! I'm your English conversation partner. Let's practice speaking English together!",
  help: "I can help you practice English! Try telling me about your day, asking questions, or discussing any topic you like.",
  default: "That's interesting! Could you tell me more about that? Try to use complete sentences to practice more!"
}

export const getSimulatedResponse = (message: string): string => {
  const lower = message.toLowerCase()

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('xin chào')) {
    return simulatedResponses.greeting
  }
  if (lower.includes('help') || lower.includes('how') || lower.includes('?')) {
    return simulatedResponses.help
  }
  if (lower.includes('thank')) {
    return "You're welcome! Keep practicing. What else would you like to discuss?"
  }
  if (lower.includes('bye') || lower.includes('tạm biệt')) {
    return "Goodbye! It was great practicing with you. See you next time!"
  }

  return simulatedResponses.default
}