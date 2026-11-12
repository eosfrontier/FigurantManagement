import { createJoomlaSessionClient } from '../api/joomlaSessionClient.js'
import { normalizeSession } from '../api/normalizers.js'
import { delayedClone } from './mockDataSource.js'

export function createSessionDataSource({
  config,
  delayMs = 0,
  fetchImpl = globalThis.fetch,
}) {
  const normalize = (raw) => normalizeSession(raw, config.managerGroupIds)

  if (config.mode === 'mock') {
    const session = normalize(config.mockUser)
    return ({ signal } = {}) => delayedClone(session, delayMs, signal)
  }

  if (config.mode === 'none') {
    const session = normalize({
      id: 'local-no-auth',
      groups: config.managerGroupIds,
    })
    return ({ signal } = {}) => delayedClone(session, delayMs, signal)
  }

  const client = createJoomlaSessionClient({
    baseUrl: config.baseUrl,
    fetchImpl,
  })
  return async ({ signal } = {}) =>
    normalize(await client.getSession({ signal }))
}
