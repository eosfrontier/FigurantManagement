import process from 'node:process'

const ENV_FILE = '.env.local'
const REQUIRED_API_PATH_SUFFIX = '/orthanc/v2/'

class SmokeTestError extends Error {
  constructor(
    message,
    { operation = 'configuration', status = null, code = 'SMOKE_FAILURE' } = {},
  ) {
    super(message)
    this.name = 'SmokeTestError'
    this.operation = operation
    this.status = status
    this.code = code
  }
}

function loadLocalEnvironment() {
  try {
    process.loadEnvFile(ENV_FILE)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new SmokeTestError(
        `Missing ${ENV_FILE}. Copy .env.example and provide local values.`,
      )
    }
    throw new SmokeTestError(`Unable to load ${ENV_FILE}.`)
  }
}

function requireEnvironmentValue(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new SmokeTestError(`${name} is not configured in ${ENV_FILE}.`)
  }
  return value
}

function readTimeout() {
  const rawValue = process.env.ORTHANC_SMOKE_TIMEOUT_MS?.trim() || '10000'
  const timeout = Number(rawValue)

  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 60000) {
    throw new SmokeTestError(
      'ORTHANC_SMOKE_TIMEOUT_MS must be an integer from 1000 through 60000.',
    )
  }

  return timeout
}

function validateBaseUrl(rawBaseUrl) {
  let baseUrl
  try {
    baseUrl = new URL(rawBaseUrl)
  } catch {
    throw new SmokeTestError('ORTHANC_BASE_URL must be a valid absolute URL.')
  }

  if (baseUrl.username || baseUrl.password) {
    throw new SmokeTestError(
      'ORTHANC_BASE_URL must not contain embedded credentials.',
    )
  }

  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(
    baseUrl.hostname,
  )
  if (baseUrl.protocol !== 'https:' && !isLocalhost) {
    throw new SmokeTestError(
      'ORTHANC_BASE_URL must use HTTPS unless it targets localhost.',
    )
  }

  if (baseUrl.pathname === '/') {
    baseUrl.pathname = REQUIRED_API_PATH_SUFFIX
  } else if (baseUrl.pathname.endsWith('/orthanc/v2')) {
    baseUrl.pathname += '/'
  } else if (!baseUrl.pathname.endsWith(REQUIRED_API_PATH_SUFFIX)) {
    throw new SmokeTestError(
      `ORTHANC_BASE_URL must be an origin or end with ${REQUIRED_API_PATH_SUFFIX}`,
    )
  }

  baseUrl.search = ''
  baseUrl.hash = ''
  return baseUrl
}

function valueType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function bodyShape(value) {
  if (Array.isArray(value)) return 'array'
  if (value === null) return 'null'
  return typeof value === 'object' ? 'object' : typeof value
}

function fieldTypeSummary(records) {
  const fieldTypes = new Map()

  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) continue

    for (const [key, value] of Object.entries(record)) {
      if (!fieldTypes.has(key)) fieldTypes.set(key, new Set())
      fieldTypes.get(key).add(valueType(value))
    }
  }

  return Object.fromEntries(
    [...fieldTypes.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, types]) => [key, [...types].sort()]),
  )
}

function schemaSummary(value) {
  const shape = bodyShape(value)
  const records = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? [value]
      : []

  return {
    shape,
    ...(Array.isArray(value) ? { count: value.length } : {}),
    fields: fieldTypeSummary(records),
  }
}

function countDuplicateCharacterIds(value) {
  if (!Array.isArray(value)) return null

  const seen = new Set()
  let duplicateCount = 0

  for (const record of value) {
    const id = record?.characterID
    if (id === undefined || id === null) continue
    const normalizedId = String(id)
    if (seen.has(normalizedId)) duplicateCount += 1
    seen.add(normalizedId)
  }

  return duplicateCount
}

async function readJsonResponse(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    const edgeChallenge =
      response.headers.get('cf-mitigated')?.toLowerCase() === 'challenge'
    throw new SmokeTestError(
      edgeChallenge
        ? 'A Cloudflare challenge blocked the request before it reached Orthanc.'
        : 'Orthanc returned a non-JSON response.',
      {
        status: response.status,
        code: edgeChallenge ? 'EDGE_CHALLENGE' : 'NON_JSON_RESPONSE',
      },
    )
  }
}

function createOrthancReader({ baseUrl, token, timeout }) {
  return async function get(operation, relativePath, operationHeaders = {}) {
    const startedAt = performance.now()
    let response

    try {
      response = await fetch(new URL(relativePath, baseUrl), {
        method: 'GET',
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(timeout),
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
          token,
          ...operationHeaders,
        },
      })
    } catch (error) {
      const timedOut = error?.name === 'TimeoutError'
      throw new SmokeTestError(
        timedOut ? 'Orthanc request timed out.' : 'Orthanc network request failed.',
        { operation },
      )
    }

    const durationMs = Math.round(performance.now() - startedAt)
    let data
    try {
      data = await readJsonResponse(response)
    } catch (error) {
      error.operation = operation
      throw error
    }

    if (response.status >= 300 && response.status < 400) {
      throw new SmokeTestError(
        'Orthanc returned a redirect; credentials were not forwarded.',
        { operation, status: response.status },
      )
    }

    return {
      operation,
      status: response.status,
      ok: response.ok,
      durationMs,
      data,
      schema: schemaSummary(data),
    }
  }
}

function requireSuccessfulResult(result, { allowEmpty404 = false } = {}) {
  if (result.ok) return result
  if (allowEmpty404 && result.status === 404) return result

  throw new SmokeTestError('Orthanc returned an unsuccessful status.', {
    operation: result.operation,
    status: result.status,
  })
}

function publicResult(result, extras = {}) {
  return {
    operation: result.operation,
    status: result.status,
    outcome:
      result.status === 404 ? 'empty' : result.ok ? 'success' : 'unexpected',
    durationMs: result.durationMs,
    ...result.schema,
    ...extras,
  }
}

function findGroupId(groups, requestedName) {
  if (!Array.isArray(groups)) return null

  const exactMatch = groups.find(
    (group) =>
      typeof group?.title === 'string' &&
      group.title.localeCompare(requestedName, undefined, {
        sensitivity: 'base',
      }) === 0,
  )

  return exactMatch?.id ?? null
}

async function run() {
  loadLocalEnvironment()

  const baseUrl = validateBaseUrl(requireEnvironmentValue('ORTHANC_BASE_URL'))
  const token = requireEnvironmentValue('ORTHANC_API_TOKEN')
  const timeout = readTimeout()
  const groupName =
    process.env.ORTHANC_FIGURANT_GROUP_NAME?.trim() || 'monsterland'
  const get = createOrthancReader({ baseUrl, token, timeout })
  const results = []

  const health = requireSuccessfulResult(await get('health', 'health/'))
  results.push(
    publicResult(health, {
      healthy:
        typeof health.data?.healthy === 'boolean'
          ? health.data.healthy
          : 'unknown',
    }),
  )

  const groups = requireSuccessfulResult(
    await get('figurant-group', 'joomla/groups/', { name: groupName }),
    { allowEmpty404: true },
  )
  results.push(publicResult(groups))

  const groupId = findGroupId(groups.data, groupName)
  if (groupId === null) {
    throw new SmokeTestError(
      'The configured figurant group was not returned by Orthanc.',
      { operation: 'figurant-group', status: groups.status },
    )
  }

  const users = requireSuccessfulResult(
    await get('current-event-users', 'joomla/users/', {
      group_id: String(groupId),
      current_event: '1',
    }),
    { allowEmpty404: true },
  )
  results.push(publicResult(users))

  const figurants = requireSuccessfulResult(
    await get('active-figurant-characters', 'chars_figu/', {
      all_figurants: '1',
    }),
    { allowEmpty404: true },
  )
  results.push(
    publicResult(figurants, {
      duplicateCharacterIds: countDuplicateCharacterIds(figurants.data),
    }),
  )

  const currentEvent = requireSuccessfulResult(
    await get('current-event', 'event/current/'),
  )
  results.push(publicResult(currentEvent))

  console.log(
    JSON.stringify(
      {
        ok: true,
        readOnly: true,
        executedAt: new Date().toISOString(),
        results,
      },
      null,
      2,
    ),
  )
}

run().catch((error) => {
  const safeError =
    error instanceof SmokeTestError
      ? error
      : new SmokeTestError('Unexpected smoke-test failure.')

  console.error(
    JSON.stringify(
      {
        ok: false,
        readOnly: true,
        operation: safeError.operation,
        status: safeError.status,
        code: safeError.code,
        message: safeError.message,
      },
      null,
      2,
    ),
  )
  process.exitCode = 1
})
