import { ref, computed } from 'vue'
import type { Message } from '../types'

// NVIDIA NIM API configuration
// Load from environment variables with fallback defaults
const NVIDIA_API_KEY = ref(import.meta.env.VITE_NVIDIA_API_KEY || '')
const NVIDIA_MODEL = ref(import.meta.env.VITE_NVIDIA_MODEL || 'minimaxai/minimax-m2.7')

export const useNVIDIA = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const setApiKey = (key: string) => {
    NVIDIA_API_KEY.value = key
  }

  const setModel = (model: string) => {
    NVIDIA_MODEL.value = model
  }

  const hasApiKey = computed(() => NVIDIA_API_KEY.value.length > 0)

  const sendMessage = async (messages: Message[]): Promise<string> => {
    if (!NVIDIA_API_KEY.value) {
      throw new Error('NVIDIA API key not configured')
    }

    isLoading.value = true
    error.value = null

    try {
      // Use proxy server to avoid CORS
      const proxyPort = import.meta.env.VITE_PROXY_PORT || '3333'
      const response = await fetch(`http://localhost:${proxyPort}/proxy/nvidia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: NVIDIA_API_KEY.value,
          model: NVIDIA_MODEL.value,
          messages: messages.map(m => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.content
          })),
          temperature: 1,
          top_p: 1,
          max_tokens: 16384,
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