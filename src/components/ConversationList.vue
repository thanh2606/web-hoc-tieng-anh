<script setup lang="ts">
import { ref } from 'vue'
import type { ConversationSummary } from '../composables/useChatHistory'

const props = defineProps<{
  conversations: ConversationSummary[]
  currentId: string | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'new'): void
  (e: 'delete', id: string): void
  (e: 'rename', id: string, title: string): void
}>()

const editingId = ref<string | null>(null)
const editTitle = ref('')
const confirmDeleteId = ref<string | null>(null)

function startEdit(id: string, title: string) {
  editingId.value = id
  editTitle.value = title
}

function saveEdit() {
  const title = editTitle.value.trim()
  if (editingId.value && title) {
    emit('rename', editingId.value, title)
  }
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return 'Hôm qua'
  if (days < 7) return `${days} ngày trước`
  return d.toLocaleDateString('vi-VN')
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str
}
</script>

<template>
  <aside class="w-64 bg-white border-r border-gray-200 flex flex-col h-full">

    <!-- List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
      <div v-if="loading" class="flex items-center justify-center py-8">
        <svg class="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>

      <div v-else-if="conversations.length === 0" class="text-center py-8">
        <p class="text-xs text-gray-400">Chưa có hội thoại</p>
      </div>

      <div
        v-for="conv in conversations"
        :key="conv.id"
        :class="[
          'w-full rounded-lg transition-colors group',
          currentId === conv.id
            ? 'bg-blue-50'
            : 'hover:bg-gray-50'
        ]"
      >
        <!-- Editing state -->
        <div v-if="editingId === conv.id" class="p-2">
          <input
            v-model="editTitle"
            ref="editInput"
            @keydown.enter="saveEdit"
            @keydown.esc="cancelEdit"
            @blur="saveEdit"
            class="w-full px-2 py-1 text-xs border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            autofocus
          />
        </div>

        <!-- Normal state -->
        <button
          v-else
          @click="emit('select', conv.id)"
          class="w-full text-left p-2.5"
        >
          <div class="flex items-start justify-between gap-1">
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium text-gray-800 truncate">
                {{ truncate(conv.title, 28) }}
              </p>
              <p class="text-[10px] text-gray-400 mt-0.5">
                {{ formatDate(conv.updatedAt) }}
              </p>
            </div>
            <div class="flex gap-0.5 flex-shrink-0">
              <button
                v-if="currentId === conv.id"
                @click.stop="startEdit(conv.id, conv.title)"
                class="p-1 rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                title="Đổi tên"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                v-if="currentId === conv.id"
                @click.stop="confirmDeleteId = conv.id"
                class="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                title="Xóa"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-3 border-t border-gray-200">
      <p class="text-[10px] text-gray-400 text-center">{{ conversations.length }} hội thoại</p>
    </div>

    <!-- Delete Confirm Overlay -->
    <div
      v-if="confirmDeleteId"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="confirmDeleteId = null"
    >
      <div class="bg-white rounded-xl shadow-xl p-5 mx-4 max-w-xs w-full">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-800">Xóa hội thoại?</h3>
            <p class="text-xs text-gray-500 mt-0.5">Hành động này không thể hoàn tác.</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="confirmDeleteId = null"
            class="flex-1 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            @click="emit('delete', confirmDeleteId); confirmDeleteId = null"
            class="flex-1 px-3 py-2 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
