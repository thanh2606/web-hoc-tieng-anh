<script setup lang="ts">
defineProps<{
  activeTab: string
}>()

const emit = defineEmits<{
  (e: 'select', tab: string): void
}>()

const tabs = [
  { id: 'chat', label: 'Trò chuyện', icon: 'chat' },
  { id: 'vocabulary', label: 'Từ vựng', icon: 'vocabulary' },
  { id: 'settings', label: 'Cài đặt', icon: 'settings' }
]
</script>

<template>
  <aside class="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="emit('select', tab.id)"
      :class="[
        'w-14 flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all relative',
        activeTab === tab.id
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50'
      ]"
      :title="tab.label"
    >
      <!-- Icon container -->
      <div
        :class="[
          'flex items-center justify-center transition-all',
          activeTab === tab.id ? 'scale-100' : 'scale-90'
        ]"
      >
        <!-- Chat icon -->
        <svg v-if="tab.icon === 'chat'" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <!-- Settings icon -->
        <svg v-else-if="tab.icon === 'settings'" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <!-- Vocabulary icon -->
        <svg v-else-if="tab.icon === 'vocabulary'" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <!-- Tab label -->
      <span
        :class="[
          'text-[10px] leading-tight font-medium transition-colors',
          activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
        ]"
      >
        {{ tab.label }}
      </span>
    </button>

    <!-- Bottom spacer -->
    <div class="flex-1" />

    <!-- App logo small -->
    <div class="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm opacity-50">
      <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </div>
  </aside>
</template>
