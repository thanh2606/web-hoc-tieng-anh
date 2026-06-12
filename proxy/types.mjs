/**
 * @typedef {Object} ChatCompletionRequest
 * @property {string} apiKey
 * @property {string} model
 * @property {Array<{role: string, content: string}>} messages
 * @property {number} [temperature]
 * @property {number} [top_p]
 * @property {number} [max_tokens]
 * @property {boolean} [stream]
 */

export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
export const OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/completions'