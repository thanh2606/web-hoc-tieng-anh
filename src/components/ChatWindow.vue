<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Message } from '../types'
import MessageBubble from './MessageBubble.vue'
import ChatInput from './ChatInput.vue'
import { useOpenAI } from '../composables/useOpenAI'
import { useNVIDIA } from '../composables/useNVIDIA'

const props = defineProps<{
  conversationId: string | null
  messages: Message[]
  loading: boolean
  isTyping: boolean
}>()

const emit = defineEmits<{
  (e: 'send', content: string): void
  (e: 'new'): void
}>()

const { hasApiKey: hasOpenAIKey } = useOpenAI()
const { hasApiKey: hasNVIDIAKey } = useNVIDIA()

const hasApiKey = computed(() => hasOpenAIKey.value || hasNVIDIAKey.value)
const messagesContainer = ref<HTMLElement | null>(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(() => props.messages, scrollToBottom, { deep: true })
</script>

<template>
  <div class="flex flex-col h-full bg-gray-50 flex-1 min-w-0">
    <!-- Header -->
    <div v-if="!hasApiKey" class="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
      <div class="flex items-center gap-2 text-xs text-amber-700">
        <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Chế độ luyện tập — chưa cấu hình API key.
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-4 border-b border-gray-100">
      <svg class="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="text-xs text-gray-400 ml-2">Đang tải...</span>
    </div>

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
    <ChatInput @send="(content) => emit('send', content)" :disabled="!conversationId || isTyping" />
  </div>
</template>
