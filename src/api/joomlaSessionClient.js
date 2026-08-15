import { createJsonClient } from './http.js'

export function createJoomlaSessionClient({
  baseUrl = '/assets/',
  fetchImpl = globalThis.fetch,
} = {}) {
  const http = createJsonClient({
    baseUrl,
    service: 'joomla-session',
    fetchImpl,
    credentials: 'include',
  })

  return {
    getSession({ signal } = {}) {
      return http.get('idandgroups.php', {
        operation: 'getSession',
        signal,
      })
    },
  }
}
