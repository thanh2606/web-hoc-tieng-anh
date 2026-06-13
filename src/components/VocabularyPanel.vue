<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useVocabulary } from '../composables/useVocabulary'
import type { SuggestionWord, VocabularyWord } from '../types'

const {
  words,
  loading,
  error,
  total,
  page,
  totalPages,
  loadWords,
  addWord,
  deleteWord,
  updateWord,
  suggestWords
} = useVocabulary()

const showForm = ref(false)
const newWord = ref('')
const newMeaning = ref('')
const newExample = ref('')
const newNote = ref('')
const adding = ref(false)
const addError = ref<string | null>(null)
const deleting = ref<string | null>(null)

// Edit state
const editing = ref(false)
const editWord = ref('')
const editMeaning = ref('')
const editExample = ref('')
const editNote = ref('')
const savingEdit = ref(false)

// Suggestions state
const topics = [
  'Gia đình', 'Công việc', 'Du lịch', 'Thời tiết',
  'Ẩm thực', 'Sức khỏe', 'Giải trí', 'Mua sắm',
  'Giao thông', 'Trường học', 'Ngẫu nhiên',
  'Công nghệ', 'Kinh doanh', 'Môi trường', 'Văn hóa',
  'Thể thao', 'Tình bạn', 'Tình yêu', 'Sách & Phim ảnh',
  'Âm nhạc', 'Thời trang'
]
const selectedTopic = ref('Ngẫu nhiên')
const suggestions = ref<SuggestionWord[]>([])
const suggesting = ref(false)
const suggestError = ref<string | null>(null)
const addedSet = ref<Set<string>>(new Set())
const isUsingFallback = ref(false)

onMounted(() => {
  loadWords()
})

function resetForm() {
  newWord.value = ''
  newMeaning.value = ''
  newExample.value = ''
  newNote.value = ''
  showForm.value = false
}

async function handleAdd() {
  if (!newWord.value.trim() || adding.value) return
  adding.value = true
  addError.value = null
  const id = await addWord(
    newWord.value.trim(),
    newMeaning.value.trim(),
    newExample.value.trim(),
    newNote.value.trim()
  )
  adding.value = false
  if (id) {
    resetForm()
  } else {
    addError.value = 'Không thể thêm từ. Vui lòng thử lại.'
  }
}

async function handleDelete(id: string) {
  deleting.value = id
  await deleteWord(id)
  deleting.value = null
}

function startEditing() {
  if (!selectedWord.value) return
  editWord.value = selectedWord.value.word
  editMeaning.value = selectedWord.value.meaning
  editExample.value = selectedWord.value.example
  editNote.value = selectedWord.value.note
  editing.value = true
}

async function handleSaveEdit() {
  if (!selectedWord.value || !editWord.value.trim() || savingEdit.value) return
  savingEdit.value = true
  const ok = await updateWord(
    selectedWord.value.id,
    editWord.value.trim(),
    editMeaning.value.trim(),
    editExample.value.trim(),
    editNote.value.trim()
  )
  savingEdit.value = false
  if (ok) {
    selectedWord.value = {
      ...selectedWord.value,
      word: editWord.value.trim(),
      meaning: editMeaning.value.trim(),
      example: editExample.value.trim(),
      note: editNote.value.trim()
    }
    editing.value = false
  }
}

function cancelEditing() {
  editing.value = false
}

async function handleSuggest() {
  suggesting.value = true
  suggestError.value = null
  suggestions.value = []
  isUsingFallback.value = false

  const result = await suggestWords(selectedTopic.value, 10)
  suggestions.value = result

  // Detect if we got simulated (no real API key used)
  if (result.length > 0) {
    const first = result[0]
    isUsingFallback.value = 'meanings' in first && first.example && typeof first.example.en === 'string' && first.example.en.includes('useful word')
  }

  suggesting.value = false
}

async function handleAddSuggestion(item: SuggestionWord) {
  if (addedSet.value.has(item.word)) return
  const meaning = item.meanings.join(', ')
  const example = `[en] ${item.example.en}\n[vi] ${item.example.vi}`
  const id = await addWord(item.word, meaning, example, '')
  if (id) {
    addedSet.value = new Set([...addedSet.value, item.word])
  }
}

const addingAll = ref(false)
const selectedWord = ref<VocabularyWord | null>(null)
const showSuggestions = ref(true)

async function handleAddAllSuggestions() {
  if (addingAll.value) return
  addingAll.value = true
  for (const item of suggestions.value) {
    if (addedSet.value.has(item.word)) continue
    const id = await addWord(item.word, item.meanings.join(', '), `[en] ${item.example.en}\n[vi] ${item.example.vi}`, '')
    if (id) {
      addedSet.value = new Set([...addedSet.value, item.word])
    }
  }
  addingAll.value = false
  suggestions.value = []
  addedSet.value = new Set()
}

function parseExample(ex: string): { en: string; vi: string } | null {
  if (!ex) return null
  const enMatch = ex.match(/\[en\]\s*(.+?)(?:\n|$)/)
  const viMatch = ex.match(/\[vi\]\s*(.+)/)
  if (enMatch || viMatch) {
    return {
      en: (enMatch ? enMatch[1] : ex).trim(),
      vi: (viMatch ? viMatch[1] : '').trim()
    }
  }
  return null
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hour}:${min}`
}
</script>

<template>
  <div class="flex-1 bg-gray-50 h-full overflow-y-auto">
    <div class="flex h-full w-full mx-auto p-2 pt-2 gap-2">
      <!-- ===== Left Column: Suggestions + Add Form ===== -->
      <div class="w-[480px] flex-shrink-0 flex flex-col gap-6">

        <!-- Card: Suggestions -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <button
            @click="showSuggestions = !showSuggestions"
            class="w-full flex items-center justify-between text-sm font-semibold text-gray-700 transition-colors"
          >
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Gợi ý từ vựng
            </span>
            <svg
              class="w-4 h-4 text-gray-400 transition-transform"
              :class="showSuggestions ? 'rotate-180' : ''"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div v-if="showSuggestions" class="space-y-4">
          <!-- Topic chips -->
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="topic in topics"
              :key="topic"
              @click="selectedTopic = topic"
              :class="[
                'px-3 py-1 rounded-full text-xs font-medium transition-all',
                selectedTopic === topic
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 hover:border-gray-300'
              ]"
            >
              {{ topic }}
            </button>
          </div>

          <!-- Gợi ý button -->
          <div class="flex justify-end">
            <button
              @click="handleSuggest"
              :disabled="suggesting"
              class="text-xs font-medium px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="suggesting" class="flex items-center gap-1.5">
                <svg class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang tạo...
              </span>
              <span v-else>Gợi ý từ</span>
            </button>
          </div>

          <!-- Fallback indicator -->
          <div
            v-if="isUsingFallback"
            class="text-xs text-amber-600 flex items-center gap-1.5 p-2 bg-amber-50 rounded-lg border border-amber-200"
          >
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Đang dùng dữ liệu mẫu. Cấu hình API key để nhận gợi ý từ AI thông minh hơn.</span>
          </div>

          <!-- Suggest error -->
          <div
            v-if="suggestError"
            class="text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2"
          >
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p>{{ suggestError }}</p>
              <button @click="handleSuggest" class="underline text-xs mt-1 hover:no-underline">Thử lại</button>
            </div>
          </div>

          <!-- Suggest loading -->
          <div
            v-if="suggesting"
            class="flex items-center justify-center py-8 text-gray-400"
          >
            <svg class="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span class="text-sm ml-2">AI đang tạo gợi ý...</span>
          </div>

          <!-- Suggest results -->
          <div v-else-if="suggestions.length > 0" class="space-y-2">
            <div class="flex items-center justify-between px-1">
              <span class="text-xs text-gray-400">{{ suggestions.length }} từ gợi ý</span>
              <button
                @click="handleAddAllSuggestions"
                :disabled="addingAll || suggestions.every(s => addedSet.has(s.word))"
                class="text-xs font-medium px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span v-if="addingAll" class="flex items-center gap-1.5">
                  <svg class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang thêm...
                </span>
                <span v-else>+ Thêm tất cả</span>
              </button>
            </div>
            <div
              v-for="(item, index) in suggestions"
              :key="index"
              class="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2 flex-wrap">
                  <span class="text-sm font-semibold text-gray-900">{{ item.word }}</span>
                  <span class="text-xs text-gray-500">— {{ item.meanings.join(', ') }}</span>
                </div>
                <p class="text-xs text-gray-400 mt-0.5 line-clamp-2">
                  <span class="not-italic">📖</span>
                  <span class="italic">"{{ item.example.en }}"</span>
                </p>
                <p class="text-xs text-gray-400 mt-0.5 line-clamp-1">
                  <span class="not-italic">🇻🇳</span>
                  {{ item.example.vi }}
                </p>
              </div>
              <button
                v-if="!addedSet.has(item.word)"
                @click="handleAddSuggestion(item)"
                class="flex-shrink-0 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Thêm
              </button>
              <span
                v-else
                class="flex-shrink-0 px-2.5 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-lg"
              >
                ✓ Đã thêm
              </span>
            </div>
          </div>
          </div>
        </div>

        <!-- Card: Add word form -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <button
            @click="showForm = !showForm"
            class="w-full flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {{ showForm ? 'Thu gọn' : 'Thêm từ mới' }}
            </span>
            <svg
              class="w-4 h-4 transition-transform"
              :class="showForm ? 'rotate-180' : ''"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div v-if="showForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Từ <span class="text-red-500">*</span></label>
              <input
                v-model="newWord"
                type="text"
                placeholder="Ví dụ: beautiful"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nghĩa</label>
              <input
                v-model="newMeaning"
                type="text"
                placeholder="Ví dụ: đẹp, xinh đẹp"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ví dụ</label>
              <input
                v-model="newExample"
                type="text"
                placeholder="Ví dụ: The sunset is beautiful today."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <input
                v-model="newNote"
                type="text"
                placeholder="Ghi chú thêm (không bắt buộc)"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
              />
            </div>
            <div v-if="addError" class="text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
              {{ addError }}
            </div>
            <div class="flex gap-3 pt-1">
              <button
                @click="resetForm"
                class="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                @click="handleAdd"
                :disabled="!newWord.trim() || adding"
                class="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span v-if="adding" class="flex items-center justify-center gap-2">
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang thêm...
                </span>
                <span v-else>Thêm từ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== Right Column: Word List ===== -->
      <div class="flex-1 min-w-0 flex flex-col">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1 flex flex-col min-h-0">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-700">
              Danh sách từ vựng
              <span v-if="words.length > 0" class="text-xs font-normal text-gray-400 ml-1">({{ words.length }})</span>
            </h2>
          </div>

          <!-- Global error -->
          <div v-if="error" class="text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
            {{ error }}
          </div>

          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-10 text-gray-400">
            <svg class="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span class="text-sm ml-2">Đang tải...</span>
          </div>

          <!-- Empty state -->
          <div v-else-if="words.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-400 flex-1">
            <svg class="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p class="text-sm font-medium">Chưa có từ vựng nào</p>
            <p class="text-xs mt-1">Hãy thêm từ đầu tiên để bắt đầu học!</p>
          </div>

          <!-- Word list (scrollable) -->
          <div v-else class="flex-1 space-y-2 overflow-y-auto -mx-2 px-2">
            <div
              v-for="item in words"
              :key="item.id"
              @click="selectedWord = item"
              class="flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100 cursor-pointer"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2">
                  <span class="text-base font-semibold text-gray-900">{{ item.word }}</span>
                  <span v-if="item.meaning" class="text-sm text-gray-500">— {{ item.meaning }}</span>
                </div>
                <p v-if="item.example" class="text-sm text-gray-400 italic mt-0.5 truncate">
                  <template v-if="parseExample(item.example)">
                    "{{ parseExample(item.example)!.en }}"
                  </template>
                  <template v-else>
                    "{{ item.example }}"
                  </template>
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <span v-if="item.note" class="text-xs text-gray-400">📝 {{ item.note }}</span>
                  <span class="text-xs text-gray-400">{{ formatDate(item.createdAt) }}</span>
                </div>
              </div>
              <button
                @click="handleDelete(item.id)"
                :disabled="deleting === item.id"
                class="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                title="Xoá từ"
              >
                <svg v-if="deleting !== item.id" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <svg v-else class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
            <span class="text-xs text-gray-400">Trang {{ page }} / {{ totalPages }} ({{ total }} từ)</span>
            <div class="flex items-center gap-1">
              <button
                @click="loadWords(page - 1)"
                :disabled="page <= 1 || loading"
                class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                v-for="p in totalPages"
                :key="p"
                @click="loadWords(p)"
                :disabled="loading"
                :class="[
                  'w-7 h-7 text-xs font-medium rounded-lg transition-colors',
                  p === page
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                ]"
              >
                {{ p }}
              </button>
              <button
                @click="loadWords(page + 1)"
                :disabled="page >= totalPages || loading"
                class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Word detail modal -->
  <Teleport to="body">
    <div
      v-if="selectedWord"
      @click.self="selectedWord = null; editing = false"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <template v-if="!editing">
            <div class="flex items-baseline gap-3">
              <h3 class="text-xl font-bold text-gray-900">{{ selectedWord.word }}</h3>
              <span v-if="selectedWord.meaning" class="text-base text-gray-500">— {{ selectedWord.meaning }}</span>
            </div>
            <div class="flex items-center gap-1">
              <button
                @click="startEditing"
                class="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                title="Sửa"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="selectedWord = null"
                class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </template>
          <template v-else>
            <h3 class="text-lg font-bold text-gray-900">Chỉnh sửa từ</h3>
            <button
              @click="cancelEditing"
              class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </template>
        </div>

        <!-- View mode -->
        <template v-if="!editing">
          <div class="space-y-4">
            <div v-if="selectedWord.example">
              <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Ví dụ</label>
              <div class="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1.5">
                <template v-if="parseExample(selectedWord.example)">
                  <p class="text-sm text-gray-700 italic">"{{ parseExample(selectedWord.example)!.en }}"</p>
                  <p class="text-xs text-gray-400">🇻🇳 {{ parseExample(selectedWord.example)!.vi }}</p>
                </template>
                <p v-else class="text-sm text-gray-700 italic">"{{ selectedWord.example }}"</p>
              </div>
            </div>
            <div v-if="selectedWord.note">
              <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Ghi chú</label>
              <p class="text-sm text-gray-700">{{ selectedWord.note }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Ngày thêm</label>
              <p class="text-sm text-gray-700">{{ formatDate(selectedWord.createdAt) }}</p>
            </div>
          </div>
          <div class="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              @click="selectedWord = null"
              class="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
            <button
              @click="handleDelete(selectedWord.id); selectedWord = null"
              class="px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Xoá từ
            </button>
          </div>
        </template>

        <!-- Edit mode -->
        <template v-else>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Từ <span class="text-red-500">*</span></label>
              <input
                v-model="editWord"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nghĩa</label>
              <input
                v-model="editMeaning"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ví dụ</label>
              <input
                v-model="editExample"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <input
                v-model="editNote"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div class="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              @click="cancelEditing"
              class="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Huỷ
            </button>
            <button
              @click="handleSaveEdit"
              :disabled="!editWord.trim() || savingEdit"
              class="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <span v-if="savingEdit" class="flex items-center justify-center gap-2">
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang lưu...
              </span>
              <span v-else>Lưu</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
