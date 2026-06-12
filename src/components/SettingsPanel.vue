<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useOpenAI } from '../composables/useOpenAI'
import { useNVIDIA } from '../composables/useNVIDIA'

const { setApiKey: setOpenAIApiKey, setModel: setOpenAIModel, hasApiKey: hasOpenAIKey, isLoading: openAILoading, error: openAIError } = useOpenAI()
const { setApiKey: setNVIDIAApiKey, setModel: setNVIDIAModel, hasApiKey: hasNVIDIAKey, isLoading: nvidiaLoading, error: nvidiaError } = useNVIDIA()

const selectedProvider = ref<'openai' | 'nvidia'>(
  (import.meta.env.VITE_DEFAULT_PROVIDER as 'openai' | 'nvidia') || 'nvidia'
)
const apiKey = ref('')
const selectedModel = ref('')
const resetSuccess = ref(false)

const openAIModels = [
  { value: 'gpt-4o', label: 'GPT-4o (Latest, Fast)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast, Cheap)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Powerful)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Affordable)' }
]

const nvidiaModels = [
  { value: 'minimaxai/minimax-m2.7', label: 'Minimax-M2.7 (Recommended)' },
  { value: 'z-ai/glm-5.1', label: 'GLM-5.1' },
  { value: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Llama 3.1 Nemotron 70B' },
  { value: 'mistralai/mixtral-8x7b-instruct-v0.1', label: 'Mixtral 8x7B' }
]

const currentModels = computed(() => selectedProvider.value === 'openai' ? openAIModels : nvidiaModels)

watch(selectedProvider, (provider) => {
  selectedModel.value = provider === 'openai' ? 'gpt-4o' : 'minimaxai/minimax-m2.7'
})

const handleSave = () => {
  if (apiKey.value.trim()) {
    if (selectedProvider.value === 'openai') {
      setOpenAIApiKey(apiKey.value.trim())
      setOpenAIModel(selectedModel.value)
    } else {
      setNVIDIAApiKey(apiKey.value.trim())
      setNVIDIAModel(selectedModel.value)
    }
  } else {
    if (selectedProvider.value === 'openai') {
      setOpenAIModel(selectedModel.value)
    } else {
      setNVIDIAModel(selectedModel.value)
    }
  }
}

const handleReset = () => {
  if (selectedProvider.value === 'openai') {
    setOpenAIApiKey(import.meta.env.VITE_OPENAI_API_KEY || '')
    setOpenAIModel(import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo')
  } else {
    setNVIDIAApiKey(import.meta.env.VITE_NVIDIA_API_KEY || '')
    setNVIDIAModel(import.meta.env.VITE_NVIDIA_MODEL || 'minimaxai/minimax-m2.7')
  }
  apiKey.value = ''
  resetSuccess.value = true
  setTimeout(() => { resetSuccess.value = false }, 3000)
}

const currentError = computed(() => selectedProvider.value === 'openai' ? openAIError.value : nvidiaError.value)
const currentHasKey = computed(() => selectedProvider.value === 'openai' ? hasOpenAIKey.value : hasNVIDIAKey.value)
const isLoading = computed(() => selectedProvider.value === 'openai' ? openAILoading.value : nvidiaLoading.value)
</script>

<template>
  <div class="flex-1 flex items-start justify-center bg-gray-50 h-full overflow-y-auto">
    <div class="w-full max-w-lg mx-auto p-8 pt-12">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Cài đặt AI</h1>
        <p class="text-sm text-gray-500 mt-1">Cấu hình kết nối API để trò chuyện với AI</p>
      </div>

      <!-- Reset Success -->
      <div v-if="resetSuccess" class="mb-6 text-green-600 text-sm flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Đã reset về cài đặt mặc định từ file .env
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <!-- Provider Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Nhà cung cấp (Provider)</label>
          <div class="flex gap-2">
            <button
              @click="selectedProvider = 'nvidia'"
              :class="[
                'flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm',
                selectedProvider === 'nvidia'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              ]"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                NVIDIA NIM
              </div>
            </button>
            <button
              @click="selectedProvider = 'openai'"
              :class="[
                'flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm',
                selectedProvider === 'openai'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              ]"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                OpenAI
              </div>
            </button>
          </div>
        </div>

        <!-- API Key -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input
            v-model="apiKey"
            type="password"
            :placeholder="selectedProvider === 'nvidia' ? 'nvapi-... (để trống dùng .env)' : 'sk-... (để trống dùng .env)'"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
          />
          <p v-if="selectedProvider === 'nvidia'" class="text-xs text-gray-500 mt-1.5">
            Lấy key từ
            <a href="https://build.nvidia.com/explore/discover" target="_blank" class="text-blue-500 hover:underline">NVIDIA Build</a>
          </p>
          <p v-else class="text-xs text-gray-500 mt-1.5">
            Lấy key từ
            <a href="https://platform.openai.com/api-keys" target="_blank" class="text-blue-500 hover:underline">OpenAI Platform</a>
          </p>
        </div>

        <!-- Model Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <select
            v-model="selectedModel"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            <option v-for="m in currentModels" :key="m.value" :value="m.value">
              {{ m.label }}
            </option>
          </select>
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-100" />

        <!-- Status & Error -->
        <div v-if="currentError" class="text-red-600 text-sm flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ currentError }}</span>
        </div>

        <div v-if="currentHasKey && !currentError" class="text-green-600 text-sm flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Đã kết nối thành công với <strong>{{ selectedProvider === 'openai' ? 'OpenAI' : 'NVIDIA NIM' }}</strong></span>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-2">
          <button
            @click="handleReset"
            class="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            @click="handleSave"
            :disabled="isLoading"
            class="flex-1 px-6 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <span v-if="isLoading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang lưu...
            </span>
            <span v-else>Lưu cài đặt</span>
          </button>
        </div>
      </div>

      <!-- Footer info -->
      <p class="text-xs text-gray-400 text-center mt-6">
        API key được lưu trong bộ nhớ phiên làm việc. Đặt trong file .env để lưu vĩnh viễn.
      </p>
    </div>
  </div>
</template>
