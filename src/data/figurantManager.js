import { ApiError } from '../api/errors.js'
import { createAssignmentOutbox } from '../offline/assignmentOutbox.js'

export const DEFAULT_FIGURANT_READ_TIMEOUT_MS = 15_000

function displayNameForAssignment(result, operation) {
  if (operation.assignedExternalUserId === null) return null
  if (operation.assignedDisplayName) return operation.assignedDisplayName
  return (
    result.assignableUsers?.find(
      (user) =>
        user.externalUserId === operation.assignedExternalUserId,
    )?.displayName ?? null
  )
}

export function applyAssignmentOperations(result, operations) {
  if (!result || operations.length === 0) return result
  const operationsByCharacter = new Map(
    operations.map((operation) => [operation.characterId, operation]),
  )

  return {
    ...result,
    items: result.items.map((figurant) => {
      const operation = operationsByCharacter.get(figurant.characterId)
      if (!operation) return figurant
      return {
        ...figurant,
        assignedExternalUserId: operation.assignedExternalUserId,
        assignedDisplayName: displayNameForAssignment(result, operation),
      }
    }),
  }
}

async function runWithTimeout(operation, { signal, timeoutMs }) {
  const controller = new AbortController()
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })

  try {
    return await operation(controller.signal)
  } catch (error) {
    if (timedOut) {
      throw new ApiError('Loading figurants timed out.', {
        service: 'orthanc',
        operation: 'getFigurants',
        code: 'CLIENT_TIMEOUT',
        retryable: true,
        cause: error,
      })
    }
    throw error
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}

export function createFigurantManager({
  dataSource,
  storage,
  readTimeoutMs = DEFAULT_FIGURANT_READ_TIMEOUT_MS,
  now = () => Date.now(),
  outboxOptions = {},
} = {}) {
  if (!dataSource || typeof dataSource.getFigurants !== 'function') {
    throw new TypeError('A figurant data source is required.')
  }
  if (!storage) throw new TypeError('Figurant manager storage is required.')

  async function updateCachedAssignment(operation) {
    const cached = await storage.loadSnapshot()
    if (!cached) return
    await storage.saveSnapshot(
      applyAssignmentOperations(cached.value, [operation]),
      now(),
    )
  }

  const outbox =
    typeof dataSource.setFigurantAssignment === 'function'
      ? createAssignmentOutbox({
          storage,
          sendAssignment: dataSource.setFigurantAssignment,
          onSynced: updateCachedAssignment,
          now,
          ...outboxOptions,
        })
      : null

  async function loadFigurants({ signal } = {}) {
    try {
      const result = await runWithTimeout(
        (requestSignal) => dataSource.getFigurants({ signal: requestSignal }),
        { signal, timeoutMs: readTimeoutMs },
      )
      const savedAt = now()
      try {
        await storage.saveSnapshot(result, savedAt)
      } catch (error) {
        console.error('Unable to cache the latest figurant data.', error)
      }
      return {
        ...result,
        cacheInfo: { source: 'network', savedAt },
      }
    } catch (error) {
      if (signal?.aborted) throw error
      const cached = await storage.loadSnapshot()
      if (!cached) throw error
      return {
        ...cached.value,
        cacheInfo: {
          source: 'cache',
          savedAt: cached.savedAt,
          reason:
            'Orthanc could not be reached. Showing the last saved character data.',
        },
      }
    }
  }

  return { loadFigurants, outbox, storage }
}
