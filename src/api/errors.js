export class ApiError extends Error {
  constructor(
    message,
    {
      service = 'unknown',
      operation = 'request',
      status = null,
      code = 'API_ERROR',
      retryable = false,
      cause,
    } = {},
  ) {
    super(message, cause ? { cause } : undefined)
    this.name = 'ApiError'
    this.service = service
    this.operation = operation
    this.status = status
    this.code = code
    this.retryable = retryable
  }
}

export class ContractError extends Error {
  constructor(message, { code = 'CONTRACT_ERROR', details, cause } = {}) {
    super(message, cause ? { cause } : undefined)
    this.name = 'ContractError'
    this.code = code
    this.details = details
  }
}

export class ConfigurationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ConfigurationError'
    this.code = 'CONFIGURATION_ERROR'
  }
}

export function getUserFacingError(error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Orthanc authentication failed. Check the development proxy configuration.'
    }
    if (error.status === 403) {
      return 'The Orthanc request was blocked. Check the API allowlist or proxy configuration.'
    }
    if (error.retryable) {
      return 'The service could not be reached. Please try again.'
    }
    return error.message
  }

  if (error instanceof ContractError) {
    return 'The API returned data in an unexpected format. See the developer console for details.'
  }

  if (error instanceof ConfigurationError) return error.message
  return 'Something unexpected went wrong while loading this resource.'
}
