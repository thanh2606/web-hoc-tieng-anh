<script setup lang="ts">
import { ref, watch } from 'vue'
import { useOpenAI } from '../composables/useOpenAI'
import { useNVIDIA } from '../composables/useNVIDIA'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

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

const currentModels = () => selectedProvider.value === 'openai' ? openAIModels : nvidiaModels

watch(() => props.visible, (v) => {
  if (v) {
    apiKey.value = ''
    if (selectedProvider.value === 'openai') {
      selectedModel.value = 'gpt-4o'
    } else {
      selectedModel.value = 'minimaxai/minimax-m2.7'
    }
  }
})

watch(selectedProvider, (provider) => {
  if (provider === 'openai') {
    selectedModel.value = 'gpt-4o'
  } else {
    selectedModel.value = 'minimaxai/minimax-m2.7'
  }
})

const handleSave = () => {
  // If user entered API key, use it; otherwise keep using .env values
  if (apiKey.value.trim()) {
    if (selectedProvider.value === 'openai') {
      setOpenAIApiKey(apiKey.value.trim())
      setOpenAIModel(selectedModel.value)
    } else {
      setNVIDIAApiKey(apiKey.value.trim())
      setNVIDIAModel(selectedModel.value)
    }
  } else {
    // No API key entered, just save the model selection for current provider
    if (selectedProvider.value === 'openai') {
      setOpenAIModel(selectedModel.value)
    } else {
      setNVIDIAModel(selectedModel.value)
    }
  }
  emit('close')
}

const handleReset = () => {
  // Reset to .env values
  if (selectedProvider.value === 'openai') {
    setOpenAIApiKey(import.meta.env.VITE_OPENAI_API_KEY || '')
    setOpenAIModel(import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo')
  } else {
    setNVIDIAApiKey(import.meta.env.VITE_NVIDIA_API_KEY || '')
    setNVIDIAModel(import.meta.env.VITE_NVIDIA_MODEL || 'minimaxai/minimax-m2.7')
  }
  apiKey.value = ''
  resetSuccess.value = true
  setTimeout(() => {
    resetSuccess.value = false
  }, 3000)
}

const currentError = () => selectedProvider.value === 'openai' ? openAIError.value : nvidiaError.value
const currentHasKey = () => selectedProvider.value === 'openai' ? hasOpenAIKey.value : hasNVIDIAKey.value
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Cài đặt AI</h2>

        <p class="text-sm text-gray-600 mb-4">
          Nhập API key để ghi đè cài đặt từ .env, hoặc để trống để dùng giá trị mặc định.
        </p>

        <div class="space-y-4">
          <!-- Reset Success -->
          <div v-if="resetSuccess" class="text-green-600 text-sm flex items-center gap-1 p-2 bg-green-50 rounded-lg">
            <span>✓</span> Đã reset về .env
          </div>

          <!-- Provider Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Provider</label>
            <div class="flex gap-2">
              <button
                @click="selectedProvider = 'nvidia'"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg border transition-colors',
                  selectedProvider === 'nvidia'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                ]"
              >
                NVIDIA NIM
              </button>
              <button
                @click="selectedProvider = 'openai'"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg border transition-colors',
                  selectedProvider === 'openai'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                ]"
              >
                OpenAI
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
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p v-if="selectedProvider === 'nvidia'" class="text-xs text-gray-500 mt-1">
              Lấy key từ
              <a href="https://console.anthropic.com/" target="_blank" class="text-blue-500 hover:underline">NVIDIA AI Foundry</a>
              hoặc <a href="https://build.nvidia.com/explore/discover" target="_blank" class="text-blue-500 hover:underline">NVIDIA Build</a>
            </p>
            <p v-else class="text-xs text-gray-500 mt-1">
              Lấy key từ
              <a href="https://platform.openai.com/api-keys" target="_blank" class="text-blue-500 hover:underline">OpenAI Platform</a>
            </p>
          </div>

          <!-- Model Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <select
              v-model="selectedModel"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="m in currentModels()" :key="m.value" :value="m.value">
                {{ m.label }}
              </option>
            </select>
          </div>

          <!-- Error -->
          <div v-if="currentError()" class="text-red-500 text-sm">{{ currentError() }}</div>

          <!-- Connected Status -->
          <div v-if="currentHasKey()" class="text-green-600 text-sm flex items-center gap-1">
            <span>✓</span> Đã kết nối
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            @click="emit('close')"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            @click="handleReset"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            title="Reset về .env"
          >
            Reset
          </button>
          <button
            @click="handleSave"
            :disabled="(selectedProvider === 'openai' ? openAILoading : nvidiaLoading)"
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {{ (selectedProvider === 'openai' ? openAILoading : nvidiaLoading) ? 'Đang lưu...' : 'Lưu' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>