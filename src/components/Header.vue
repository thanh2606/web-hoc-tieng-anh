<script setup lang="ts">
defineProps<{
  title: string
  showHistory?: boolean
}>()

const emit = defineEmits<{
  (e: 'newConversation'): void
}>()
</script>

<template>
  <header class="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center shrink-0">
    <!-- Left: Lịch sử + new button (only on chat tab) -->

    <!-- Center: Screen title -->
    <h1 class="flex-1 text-center text-base font-semibold text-gray-800">{{ title }}</h1>

    <!-- Right: New Chat button -->
    <div class="w-64 flex items-center justify-end">
      <button
        v-if="showHistory"
        @click="emit('newConversation')"
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Cuộc trò chuyện mới"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New Chat
      </button>
    </div>
  </header>
</template>
