import { ConfigurationError } from '../api/errors.js'
import { DEFAULT_ORTHANC_PROXY_PATH } from '../api/orthancClient.js'
import { DEFAULT_WATCHTOWER_BASE_URL } from '../api/watchtowerClient.js'

const DATA_SOURCE_MODES = new Set(['mock', 'live'])
const AUTH_MODES = new Set(['joomla', 'mock', 'none'])
const DEFAULT_MANAGER_GROUPS = ['30', '36', '8', '31']
const DEFAULT_JOOMLA_LOGIN_URL =
  'https://www.eosfrontier.space/return-to-persona'

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

function readBoolean(value, fallback, name) {
  if (value === undefined || String(value).trim() === '') return fallback
  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'true' || normalized === '1') return true
  if (normalized === 'false' || normalized === '0') return false
  throw new ConfigurationError(`${name} must be true or false.`)
}

function readList(value, fallback) {
  const values = String(value ?? fallback.join(','))
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return [...new Set(values)]
}

function readOptionalHttpBaseUrl(value, name) {
  const candidate = String(value ?? '').trim()
  if (!candidate) return ''

  let url
  try {
    url = new URL(candidate)
  } catch {
    throw new ConfigurationError(`${name} must be a valid HTTP(S) URL.`)
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ConfigurationError(`${name} must be a valid HTTP(S) URL.`)
  }
  return url.toString().replace(/\/$/, '')
}

function readAuthMode(env) {
  const development = env.DEV === true || String(env.DEV).toLowerCase() === 'true'
  const mode = String(env.VITE_AUTH_MODE ?? (development ? 'mock' : 'joomla'))
    .trim()
    .toLowerCase()

  if (!AUTH_MODES.has(mode)) {
    throw new ConfigurationError(
      'VITE_AUTH_MODE must be "joomla", "mock", or "none".',
    )
  }
  return mode
}

function readMockUser(value, managerGroupIds) {
  if (value === undefined || String(value).trim() === '') {
    return { id: 'local-manager', groups: [managerGroupIds[0]] }
  }

  try {
    return JSON.parse(String(value))
  } catch {
    throw new ConfigurationError('VITE_JOOMLA_MOCK_USER must be valid JSON.')
  }
}

export function readClientConfig(env = {}) {
  const mode = String(env.VITE_DATA_SOURCE ?? 'mock').trim().toLowerCase()
  if (!DATA_SOURCE_MODES.has(mode)) {
    throw new ConfigurationError(
      'VITE_DATA_SOURCE must be either "mock" or "live".',
    )
  }

  const managerGroupIds = readList(
    env.VITE_JOOMLA_MANAGER_GROUPS,
    DEFAULT_MANAGER_GROUPS,
  )
  if (managerGroupIds.length === 0) {
    throw new ConfigurationError(
      'VITE_JOOMLA_MANAGER_GROUPS must contain at least one group ID.',
    )
  }

  return {
    mode,
    mutationsEnabled: readBoolean(
      env.VITE_ENABLE_MUTATIONS,
      mode === 'mock',
      'VITE_ENABLE_MUTATIONS',
    ),
    groupName:
      String(env.VITE_ORTHANC_FIGURANT_GROUP_NAME ?? 'monsterland').trim() ||
      'monsterland',
    mockDelayMs: readDelay(env.VITE_MOCK_DELAY_MS),
    orthancProxyPath:
      String(env.VITE_ORTHANC_PROXY_PATH ?? DEFAULT_ORTHANC_PROXY_PATH).trim() ||
      DEFAULT_ORTHANC_PROXY_PATH,
    watchtowerBaseUrl:
      String(
        env.VITE_WATCHTOWER_BASE_URL ?? DEFAULT_WATCHTOWER_BASE_URL,
      ).trim() || DEFAULT_WATCHTOWER_BASE_URL,
    npcPhotoBaseUrl: readOptionalHttpBaseUrl(
      env.VITE_NPC_PHOTO_BASE_URL,
      'VITE_NPC_PHOTO_BASE_URL',
    ),
    session: {
      mode: readAuthMode(env),
      managerGroupIds,
      mockUser: readMockUser(env.VITE_JOOMLA_MOCK_USER, managerGroupIds),
      baseUrl: '/assets/',
      loginUrl:
        String(env.VITE_JOOMLA_LOGIN_URL ?? DEFAULT_JOOMLA_LOGIN_URL).trim() ||
        DEFAULT_JOOMLA_LOGIN_URL,
    },
  }
}
