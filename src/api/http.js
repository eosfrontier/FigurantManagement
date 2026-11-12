import { ApiError } from './errors.js'

function joinUrl(baseUrl, resourcePath) {
  return `${baseUrl.replace(/\/$/, '')}/${resourcePath.replace(/^\//, '')}`
}

function cleanHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  )
}

async function parseJsonResponse(response, { service, operation }) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch (cause) {
    throw new ApiError('The service returned a non-JSON response.', {
      service,
      operation,
      status: response.status,
      code: 'INVALID_JSON',
      retryable: response.status >= 500,
      cause,
    })
  }
}

export function createJsonClient({
  baseUrl,
  service,
  fetchImpl = globalThis.fetch,
  credentials,
}) {
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('A fetch implementation is required.')
  }

  async function request(
    method,
    resourcePath,
    { operation, headers = {}, signal, notFoundValue } = {},
  ) {
    let response
    try {
      const requestOptions = {
        method,
        cache: 'no-store',
        redirect: 'manual',
        signal,
        headers: cleanHeaders({
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
          ...headers,
        }),
      }
      if (credentials) requestOptions.credentials = credentials
      response = await fetchImpl(joinUrl(baseUrl, resourcePath), requestOptions)
    } catch (cause) {
      if (cause?.name === 'AbortError') throw cause
      throw new ApiError('The service could not be reached.', {
        service,
        operation,
        code: 'NETWORK_ERROR',
        retryable: true,
        cause,
      })
    }

    const data = await parseJsonResponse(response, { service, operation })

    if (response.status === 404 && notFoundValue !== undefined) {
      return structuredClone(notFoundValue)
    }

    if (!response.ok) {
      throw new ApiError('The service rejected the request.', {
        service,
        operation,
        status: response.status,
        code: `HTTP_${response.status}`,
        retryable: response.status >= 500,
      })
    }

    return data
  }

  return {
    get(resourcePath, options) {
      return request('GET', resourcePath, options)
    },

    put(resourcePath, options) {
      return request('PUT', resourcePath, options)
    },

    post(resourcePath, options) {
      return request('POST', resourcePath, options)
    },

    delete(resourcePath, options) {
      return request('DELETE', resourcePath, options)
    },
  }
}
