export interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export interface ChatConversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

export interface VocabularyWord {
  id: string
  word: string
  meaning: string
  example: string
  note: string
  createdAt: number
}

export interface SuggestionWord {
  word: string
  meanings: string[]
  example: {
    en: string
    vi: string
  }
}