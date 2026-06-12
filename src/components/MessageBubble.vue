<script setup lang="ts">
import type { Message } from '../types'

const props = defineProps<{
  message: Message
}>()

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<template>
  <div
    class="flex mb-4"
    :class="message.isUser ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[75%] rounded-2xl px-4 py-2"
      :class="[
        message.isUser
          ? 'bg-blue-500 text-white rounded-br-md'
          : 'bg-gray-200 text-gray-800 rounded-bl-md'
      ]"
    >
      <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
      <span
        class="text-xs mt-1 block"
        :class="message.isUser ? 'text-blue-100' : 'text-gray-500'"
      >
        {{ formatTime(message.timestamp) }}
      </span>
    </div>
  </div>
</template>