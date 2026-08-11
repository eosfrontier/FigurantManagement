import { ConfigurationError } from '../api/errors.js'
import { DEFAULT_ORTHANC_PROXY_PATH } from '../api/orthancClient.js'

const DATA_SOURCE_MODES = new Set(['mock', 'live'])

function readDelay(value) {
  if (value === undefined || String(value).trim() === '') return 150

  const delay = Number(value)
  if (!Number.isInteger(delay) || delay < 0 || delay > 5000) {
    throw new ConfigurationError(
      'VITE_MOCK_DELAY_MS must be a whole number between 0 and 5000.',
    )
  }
  return delay
}

export function readClientConfig(env = {}) {
  const mode = String(env.VITE_DATA_SOURCE ?? 'mock').trim().toLowerCase()
  if (!DATA_SOURCE_MODES.has(mode)) {
    throw new ConfigurationError(
      'VITE_DATA_SOURCE must be either "mock" or "live".',
    )
  }

  return {
    mode,
    groupName:
      String(env.VITE_ORTHANC_FIGURANT_GROUP_NAME ?? 'monsterland').trim() ||
      'monsterland',
    mockDelayMs: readDelay(env.VITE_MOCK_DELAY_MS),
    orthancProxyPath:
      String(env.VITE_ORTHANC_PROXY_PATH ?? DEFAULT_ORTHANC_PROXY_PATH).trim() ||
      DEFAULT_ORTHANC_PROXY_PATH,
  }
}
