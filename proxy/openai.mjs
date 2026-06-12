import { OPENAI_BASE_URL } from './types.mjs'

/**
 * @param {import('./types.mjs').ChatCompletionRequest} body
 */
export async function proxyOpenAIRequest(body) {
  const { apiKey, model, messages, temperature, max_tokens, stream } = body

  return fetch(OPENAI_BASE_URL, {
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
}