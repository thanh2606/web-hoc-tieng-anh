<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { Message } from '../types'
import MessageBubble from './MessageBubble.vue'
import ChatInput from './ChatInput.vue'
import SettingsModal from './SettingsModal.vue'
import { useOpenAI, getSimulatedResponse } from '../composables/useOpenAI'
import { useNVIDIA } from '../composables/useNVIDIA'

const { hasApiKey: hasOpenAIKey, isLoading: openAILoading, error: openAIError, sendMessage: sendOpenAIMessage } = useOpenAI()
const { hasApiKey: hasNVIDIAKey, isLoading: nvidiaLoading, error: nvidiaError, sendMessage: sendNVIDIAMessage } = useNVIDIA()

const hasApiKey = computed(() => hasOpenAIKey.value || hasNVIDIAKey.value)
const isLoading = computed(() => openAILoading.value || nvidiaLoading.value)
const error = computed(() => openAIError.value || nvidiaError.value)

const messages = ref<Message[]>([
  {
    id: '1',
    content: 'Hello! I am your English conversation partner. Let\'s practice speaking English together! Type your message in English and I will help you improve.',
    isUser: false,
    timestamp: new Date()
  }
])

const messagesContainer = ref<HTMLElement | null>(null)
const showSettings = ref(false)
const isTyping = ref(false)

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })

const handleSend = async (content: string) => {
  const userMessage: Message = {
    id: Date.now().toString(),
    content,
    isUser: true,
    timestamp: new Date()
  }
  messages.value.push(userMessage)

  isTyping.value = true

  try {
    let aiContent: string

    if (hasOpenAIKey.value) {
      aiContent = await sendOpenAIMessage(messages.value)
    } else if (hasNVIDIAKey.value) {
      aiContent = await sendNVIDIAMessage(messages.value)
    } else {
      // Simulated response
      await new Promise(resolve => setTimeout(resolve, 800))
      aiContent = getSimulatedResponse(content)
    }

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: aiContent,
      isUser: false,
      timestamp: new Date()
    }
    messages.value.push(aiMessage)
  } catch (e: any) {
    const errorMsg: Message = {
      id: (Date.now() + 1).toString(),
      content: `Error: ${e.message}. Please check your API key settings.`,
      isUser: false,
      timestamp: new Date()
    }
    messages.value.push(errorMsg)
  } finally {
    isTyping.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">English Chat</h1>
        <p class="text-sm text-gray-500">
          {{ hasApiKey ? 'Connected to ChatGPT' : 'Practice mode (no API key)' }}
        </p>
      </div>
      <button
        @click="showSettings = true"
        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </header>

    <!-- Messages -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto px-4 py-4"
    >
      <MessageBubble
        v-for="message in messages"
        :key="message.id"
        :message="message"
      />

      <!-- Typing indicator -->
      <div v-if="isTyping" class="flex justify-start mb-4">
        <div class="bg-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
          <div class="flex gap-1">
            <span class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
            <span class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
            <span class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <ChatInput @send="handleSend" :disabled="isTyping" />

    <!-- Settings Modal -->
    <SettingsModal
      :visible="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>