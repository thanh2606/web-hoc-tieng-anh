<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Message } from './types'
import ChatWindow from './components/ChatWindow.vue'
import ConversationList from './components/ConversationList.vue'
import Header from './components/Header.vue'
import Sidebar from './components/Sidebar.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import VocabularyPanel from './components/VocabularyPanel.vue'
import { useChatHistory } from './composables/useChatHistory'
import { useOpenAI, getSimulatedResponse } from './composables/useOpenAI'
import { useNVIDIA } from './composables/useNVIDIA'

const { hasApiKey: hasOpenAIKey, sendMessage: sendOpenAIMessage } = useOpenAI()
const { hasApiKey: hasNVIDIAKey, sendMessage: sendNVIDIAMessage } = useNVIDIA()
const { conversations, loadConversations, createConversation, loadMessages, saveMessage, deleteConversation, renameConversation } = useChatHistory()

const defaultProvider = (import.meta.env.VITE_DEFAULT_PROVIDER || 'nvidia') as 'nvidia' | 'openai'

const activeTab = ref<string>('chat')
const currentConversationId = ref<string | null>(null)
const messages = ref<Message[]>([])
const loadingMessages = ref(false)
const isTyping = ref(false)

function handleTabSelect(tab: string) {
  activeTab.value = tab
}

// Load or create conversation
async function ensureConversation(id: string | null) {
  if (id) {
    // Load existing
    currentConversationId.value = id
    loadingMessages.value = true
    messages.value = []
    const savedMessages = await loadMessages(id)
    if (savedMessages.length === 0) {
      messages.value = []
    } else {
      messages.value = savedMessages
    }
    loadingMessages.value = false
  } else {
    // Create new
    currentConversationId.value = null
    messages.value = []
    const newId = await createConversation('New Chat')
    if (newId) {
      currentConversationId.value = newId
      messages.value = []
    }
  }
}

function handleSelectConversation(id: string) {
  if (id !== currentConversationId.value) {
    ensureConversation(id)
  }
}

async function handleNewConversation() {
  ensureConversation(null)
}

async function handleDeleteConversation(id: string) {
  await deleteConversation(id)
  if (conversations.value.length > 0) {
    ensureConversation(conversations.value[0].id)
  } else {
    ensureConversation(null)
  }
}

async function handleRenameConversation(id: string, title: string) {
  await renameConversation(id, title)
}

onMounted(async () => {
  await loadConversations()
  if (conversations.value.length > 0) {
    ensureConversation(conversations.value[0].id)
  } else {
    ensureConversation(null)
  }
})

const handleSend = async (content: string) => {
  if (!currentConversationId.value) return

  // User message
  const userMessage: Message = {
    id: crypto.randomUUID(),
    content,
    isUser: true,
    timestamp: new Date()
  }
  messages.value.push(userMessage)
  saveMessage(currentConversationId.value, userMessage)

  isTyping.value = true

  try {
    let aiContent: string
    const nvidiaHasKey = hasNVIDIAKey.value
    const openaiHasKey = hasOpenAIKey.value

    if (nvidiaHasKey && openaiHasKey) {
      aiContent = defaultProvider === 'nvidia'
        ? await sendNVIDIAMessage(messages.value)
        : await sendOpenAIMessage(messages.value)
    } else if (nvidiaHasKey) {
      aiContent = await sendNVIDIAMessage(messages.value)
    } else if (openaiHasKey) {
      aiContent = await sendOpenAIMessage(messages.value)
    } else {
      await new Promise(resolve => setTimeout(resolve, 800))
      aiContent = getSimulatedResponse(content)
    }

    const aiMessage: Message = {
      id: crypto.randomUUID(),
      content: aiContent,
      isUser: false,
      timestamp: new Date()
    }
    messages.value.push(aiMessage)
    saveMessage(currentConversationId.value, aiMessage)
    await loadConversations()
  } catch (e: any) {
    messages.value.push({
      id: crypto.randomUUID(),
      content: `Error: ${e.message}. Please check your API key settings.`,
      isUser: false,
      timestamp: new Date()
    })
  } finally {
    isTyping.value = false
  }
}

</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar :active-tab="activeTab" @select="handleTabSelect" />

    <div class="flex flex-col flex-1 min-w-0">
      <Header
        :title="activeTab === 'chat' ? 'Trò chuyện tiếng Anh' : activeTab === 'vocabulary' ? 'Từ vựng của tôi' : 'Cài đặt'"
        :show-history="activeTab === 'chat'"
        @new-conversation="handleNewConversation"
      />

      <div class="flex flex-1 min-h-0">
        <ConversationList
          v-if="activeTab === 'chat'"
          :conversations="conversations"
          :current-id="currentConversationId"
          :loading="false"
          @select="handleSelectConversation"
          @new="handleNewConversation"
          @delete="handleDeleteConversation"
          @rename="handleRenameConversation"
        />

        <ChatWindow
          v-if="activeTab === 'chat'"
          :conversation-id="currentConversationId"
          :messages="messages"
          :loading="loadingMessages"
          :is-typing="isTyping"
          @send="handleSend"
          @new="handleNewConversation"
        />

        <SettingsPanel v-else-if="activeTab === 'settings'" />
        <VocabularyPanel v-else-if="activeTab === 'vocabulary'" />
      </div>
    </div>
  </div>
</template>
