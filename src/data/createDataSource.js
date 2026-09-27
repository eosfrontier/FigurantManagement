import { createOrthancClient } from '../api/orthancClient.js'
import { createWatchtowerClient } from '../api/watchtowerClient.js'
import { createMockDataSource } from './mockDataSource.js'
import { createOrthancDataSource } from './orthancDataSource.js'
import { createSessionDataSource } from './sessionDataSource.js'
import { createWatchtowerDataSource } from './watchtowerDataSource.js'

export function createApplicationDataSource(
  config,
  { fetchImpl = globalThis.fetch } = {},
) {
  const sessionSource = createSessionDataSource({
    config: config.session,
    delayMs: config.mockDelayMs,
    fetchImpl,
  })
  const watchtowerSource =
    config.mode === 'mock'
      ? {}
      : createWatchtowerDataSource(
          createWatchtowerClient({
            baseUrl: config.watchtowerBaseUrl,
            fetchImpl,
          }),
        )

  const applicationSource =
    config.mode === 'mock'
      ? createMockDataSource({ delayMs: config.mockDelayMs })
      : createOrthancDataSource({
          client: createOrthancClient({
            baseUrl: config.orthancProxyPath,
            fetchImpl,
          }),
          groupName: config.groupName,
        })

  return {
    ...applicationSource,
    ...watchtowerSource,
    getSession: sessionSource,
    mode: config.mode,
  }
}
