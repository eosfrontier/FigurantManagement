import { ApiError } from '../api/errors.js'
import { FALLBACK_IN_GAME_DATE } from '../domain/inGameBirthDate.js'
import { createAssignmentOutbox } from '../offline/assignmentOutbox.js'
import { createCardOutbox } from '../offline/cardOutbox.js'
import { createDetailsOutbox } from '../offline/detailsOutbox.js'

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

export function applyCardOperations(result, operations) {
  if (!result || operations.length === 0) return result

  return operations.reduce(
    (current, operation) => ({
      ...current,
      items: current.items.map((figurant) => {
        if (figurant.characterId === operation.characterId) {
          return { ...figurant, cardId: operation.cardId }
        }
        if (figurant.cardId === operation.cardId) {
          return { ...figurant, cardId: null }
        }
        return figurant
      }),
    }),
    result,
  )
}

export function applyDetailsOperations(result, operations) {
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
        ...operation.details,
        status: operation.details.recurring
          ? 'figurant-recurring'
          : 'figurant',
      }
    }),
  }
}

export function applyCreatedFigurant(result, figurant) {
  if (!result || !figurant) return result
  if (result.items.some((item) => item.characterId === figurant.characterId)) {
    return result
  }

  return {
    ...result,
    sourceCount: result.sourceCount + 1,
    items: [...result.items, figurant].sort((left, right) =>
      left.characterName.localeCompare(right.characterName, undefined, {
        sensitivity: 'base',
      }),
    ),
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
  cardOutboxOptions = outboxOptions,
  detailsOutboxOptions = outboxOptions,
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

  async function updateCachedCard(operation) {
    const cached = await storage.loadSnapshot()
    if (!cached) return
    await storage.saveSnapshot(applyCardOperations(cached.value, [operation]), now())
  }

  async function updateCachedDetails(operation) {
    const cached = await storage.loadSnapshot()
    if (!cached) return
    await storage.saveSnapshot(
      applyDetailsOperations(cached.value, [operation]),
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

  const cardOutbox =
    typeof dataSource.setFigurantCard === 'function'
      ? createCardOutbox({
          storage,
          sendCardChange: dataSource.setFigurantCard,
          onSynced: updateCachedCard,
          now,
          ...cardOutboxOptions,
        })
      : null

  const detailsOutbox =
    typeof dataSource.updateFigurantDetails === 'function'
      ? createDetailsOutbox({
          storage,
          sendDetails: dataSource.updateFigurantDetails,
          onSynced: updateCachedDetails,
          now,
          ...detailsOutboxOptions,
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

  async function isIccNumberAvailable(iccNumber, { signal } = {}) {
    if (typeof dataSource.isIccNumberAvailable !== 'function') {
      throw new TypeError('ICC-number availability is not supported.')
    }
    return dataSource.isIccNumberAvailable(iccNumber, { signal })
  }

  async function createPreparedFigurant(draft, { signal } = {}) {
    if (typeof dataSource.createPreparedFigurant !== 'function') {
      throw new TypeError('Prepared figurant creation is not supported.')
    }

    const creation = await dataSource.createPreparedFigurant(draft, { signal })
    const cached = await storage.loadSnapshot()
    if (cached) {
      await storage.saveSnapshot(
        applyCreatedFigurant(cached.value, creation.figurant),
        now(),
      )
    }
    return creation
  }

  async function getCurrentInGameDate({ signal } = {}) {
    if (typeof dataSource.getCurrentInGameDate !== 'function') {
      return { ...FALLBACK_IN_GAME_DATE }
    }

    try {
      return await dataSource.getCurrentInGameDate({ signal })
    } catch (error) {
      if (signal?.aborted) throw error
      console.warn('Unable to retrieve the current in-game date.', error)
      return { ...FALLBACK_IN_GAME_DATE }
    }
  }

  return {
    loadFigurants,
    isIccNumberAvailable,
    createPreparedFigurant,
    getCurrentInGameDate,
    outbox,
    cardOutbox,
    detailsOutbox,
    storage,
  }
}
