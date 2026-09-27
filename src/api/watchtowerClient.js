import { createJsonClient } from './http.js'

export const DEFAULT_WATCHTOWER_BASE_URL =
  'https://api.eosfrontier.space/watchtower/'

export function createWatchtowerClient({
  baseUrl = DEFAULT_WATCHTOWER_BASE_URL,
  fetchImpl = globalThis.fetch,
} = {}) {
  const http = createJsonClient({
    baseUrl,
    service: 'watchtower',
    fetchImpl,
  })

  return {
    getCurrentTime({ signal } = {}) {
      return http.get('time/', {
        operation: 'getCurrentTime',
        signal,
      })
    },
  }
}
