<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'send', message: string): void
}>()

const message = ref('')

const handleSend = () => {
  const text = message.value.trim()
  if (!text) return

  emit('send', text)
  message.value = ''
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="flex gap-2 p-4 border-t border-gray-200 bg-white">
    <textarea
      v-model="message"
      @keydown="handleKeydown"
      placeholder="Nhập tin nhắn bằng tiếng Anh..."
      rows="1"
      :disabled="props.disabled"
      class="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
    <button
      @click="handleSend"
      :disabled="!message.trim() || props.disabled"
      class="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      Gửi
    </button>
  </div>
</template>