import { NVIDIA_BASE_URL } from './types.mjs'

/**
 * @param {import('./types.mjs').ChatCompletionRequest} body
 */
export async function proxyNvidiaRequest(body) {
  const { apiKey, model, messages, temperature, top_p, max_tokens, stream } = body

  return fetch(NVIDIA_BASE_URL, {
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
}