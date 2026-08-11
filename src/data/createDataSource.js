import { createOrthancClient } from '../api/orthancClient.js'
import { createMockDataSource } from './mockDataSource.js'
import { createOrthancDataSource } from './orthancDataSource.js'

export function createApplicationDataSource(
  config,
  { fetchImpl = globalThis.fetch } = {},
) {
  if (config.mode === 'mock') {
    return createMockDataSource({ delayMs: config.mockDelayMs })
  }

  const client = createOrthancClient({
    baseUrl: config.orthancProxyPath,
    fetchImpl,
  })
  return createOrthancDataSource({ client, groupName: config.groupName })
}
