import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { proxyNvidiaRequest } from './nvidia.mjs'
import { proxyOpenAIRequest } from './openai.mjs'
import { db } from './db.mjs'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PROXY_PORT || 3333

// --- AI Proxy Routes ---

// NVIDIA NIM proxy
app.post('/proxy/nvidia', async (req, res) => {
  try {
    const body = req.body

    if (!body.apiKey) {
      return res.status(400).json({ error: { message: 'API key is required' } })
    }

    const response = await proxyNvidiaRequest(body)
    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    res.json(data)
  } catch (error) {
    console.error('[NVIDIA Proxy Error]', error)
    res.status(500).json({ error: { message: 'Proxy server error' } })
  }
})

// OpenAI proxy
app.post('/proxy/openai', async (req, res) => {
  try {
    const body = req.body

    if (!body.apiKey) {
      return res.status(400).json({ error: { message: 'API key is required' } })
    }

    const response = await proxyOpenAIRequest(body)
    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    res.json(data)
  } catch (error) {
    console.error('[OpenAI Proxy Error]', error)
    res.status(500).json({ error: { message: 'Proxy server error' } })
  }
})

// --- Chat History API Routes ---

// List all conversations (ordered by most recent)
app.get('/api/conversations', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM conversations ORDER BY updated_at DESC'
    ).all()
    res.json(rows)
  } catch (error) {
    console.error('[DB Error]', error)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

// Create a new conversation
app.post('/api/conversations', (req, res) => {
  try {
    const { id, title } = req.body
    const now = Date.now()
    db.prepare(
      'INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).run(id, title || 'New Conversation', now, now)
    res.status(201).json({ success: true, id })
  } catch (error) {
    console.error('[DB Error]', error)
    res.status(500).json({ error: 'Failed to create conversation' })
  }
})

// Get messages for a conversation
app.get('/api/conversations/:id/messages', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT id, content, is_user as isUser, timestamp FROM messages WHERE conversation_id = ? ORDER BY timestamp'
    ).all(req.params.id)
    res.json(rows)
  } catch (error) {
    console.error('[DB Error]', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Add a message to a conversation
app.post('/api/messages', (req, res) => {
  try {
    const { id, conversation_id, content, is_user } = req.body
    const now = Date.now()

    db.prepare(
      'INSERT INTO messages (id, conversation_id, content, is_user, timestamp) VALUES (?, ?, ?, ?, ?)'
    ).run(id, conversation_id, content, is_user ? 1 : 0, now)
    db.prepare(
      'UPDATE conversations SET updated_at = ? WHERE id = ?'
    ).run(now, conversation_id)

    res.status(201).json({ success: true })
  } catch (error) {
    console.error('[DB Error]', error)
    res.status(500).json({ error: 'Failed to save message' })
  }
})

// Delete a conversation (messages cascade via FK)
app.delete('/api/conversations/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(req.params.id)
    db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('[DB Error]', error)
    res.status(500).json({ error: 'Failed to delete conversation' })
  }
})

// Rename a conversation
app.post('/api/conversations/:id/rename', (req, res) => {
  try {
    const { title } = req.body
    db.prepare('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?')
      .run(title, Date.now(), req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('[DB Error]', error)
    res.status(500).json({ error: 'Failed to rename conversation' })
  }
})

export function startProxyServer(port = PORT) {
  const server = createServer(app)
  server.listen(port, () => {
    console.log(`[Proxy] Server running on http://localhost:${port}`)
  })
  return server
}

export { app }
