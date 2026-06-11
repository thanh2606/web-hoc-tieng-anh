// Proxy server to avoid CORS issues
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 3001

// NVIDIA NIM proxy
app.post('/proxy/nvidia', async (req, res) => {
  try {
    const { apiKey, model, messages, temperature, top_p, max_tokens, stream } = req.body

    if (!apiKey) {
      return res.status(400).json({ error: { message: 'API key is required' } })
    }

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature ?? 1,
        top_p: top_p ?? 1,
        max_tokens: max_tokens ?? 16384,
        stream: stream ?? false
      })
    })

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
    const { apiKey, model, messages, temperature, max_tokens, stream } = req.body

    if (!apiKey) {
      return res.status(400).json({ error: { message: 'API key is required' } })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature ?? 1,
        max_tokens: max_tokens ?? 2048,
        stream: stream ?? false
      })
    })

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

const server = createServer(app)
server.listen(PORT, () => {
  console.log(`[Proxy] Server running on http://localhost:${PORT}`)
})