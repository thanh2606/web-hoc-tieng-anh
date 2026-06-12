import { ref } from 'vue'
import type { Message } from '../types'

export interface ConversationSummary {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

export function useChatHistory() {
  const conversations = ref<ConversationSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadConversations() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/api/conversations')
      if (!res.ok) throw new Error('Failed to load conversations')
      conversations.value = await res.json()
    } catch (e: any) {
      error.value = e.message
      console.warn('[ChatHistory]', e.message)
    } finally {
      loading.value = false
    }
  }

  async function createConversation(title = 'New Chat'): Promise<string | null> {
    error.value = null
    try {
      const id = crypto.randomUUID()
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title })
      })
      if (!res.ok) throw new Error('Failed to create conversation')
      await loadConversations()
      return id
    } catch (e: any) {
      error.value = e.message
      console.warn('[ChatHistory]', e.message)
      return null
    }
  }

  async function loadMessages(conversationId: string): Promise<Message[]> {
    error.value = null
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`)
      if (!res.ok) throw new Error('Failed to load messages')
      const data = await res.json()
      // Convert DB format back to Message format
      return data.map((row: any) => ({
        id: row.id,
        content: row.content,
        isUser: Boolean(row.isUser),
        timestamp: new Date(row.timestamp)
      }))
    } catch (e: any) {
      error.value = e.message
      console.warn('[ChatHistory]', e.message)
      return []
    }
  }

  async function saveMessage(conversationId: string, message: Message): Promise<boolean> {
    error.value = null
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: message.id,
          conversation_id: conversationId,
          content: message.content,
          is_user: message.isUser,
          timestamp: message.timestamp instanceof Date ? message.timestamp.getTime() : message.timestamp
        })
      })
      if (!res.ok) throw new Error('Failed to save message')
      return true
    } catch (e: any) {
      error.value = e.message
      console.warn('[ChatHistory]', e.message)
      return false
    }
  }

  async function deleteConversation(id: string) {
    error.value = null
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete conversation')
      await loadConversations()
    } catch (e: any) {
      error.value = e.message
      console.warn('[ChatHistory]', e.message)
    }
  }

  async function renameConversation(id: string, title: string) {
    error.value = null
    try {
      const res = await fetch(`/api/conversations/${id}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      if (!res.ok) throw new Error('Failed to rename conversation')
      await loadConversations()
      return true
    } catch (e: any) {
      error.value = e.message
      console.warn('[ChatHistory]', e.message)
      return false
    }
  }

  return {
    conversations,
    loading,
    error,
    loadConversations,
    createConversation,
    loadMessages,
    saveMessage,
    deleteConversation,
    renameConversation
  }
}
