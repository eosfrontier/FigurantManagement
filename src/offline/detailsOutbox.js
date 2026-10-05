import { ApiError } from '../api/errors.js'
import { normalizePreparedFigurantDraft } from '../domain/figurantDraft.js'

const DEFAULT_RETRY_BASE_MS = 2_000
const DEFAULT_RETRY_MAX_MS = 60_000
const DEFAULT_WRITE_TIMEOUT_MS = 15_000

function clone(value) {
  return value === undefined ? undefined : structuredClone(value)
}

function normalizeIdentifier(value) {
  const identifier = String(value ?? '').trim()
  if (!/^[1-9]\d*$/.test(identifier)) {
    throw new TypeError('characterId must be a positive numeric identifier.')
  }
  return identifier
}

function isRetryable(error) {
  if (typeof error?.retryable === 'boolean') return error.retryable
  if (error?.name === 'ContractError' || error instanceof TypeError) return false
  return true
}

function publicFailure(error, retryable) {
  return retryable
    ? {
        code: error?.code ?? 'TEMPORARY_FAILURE',
        message: 'Waiting for the service to become available.',
        retryable: true,
      }
    : {
        code: error?.code ?? 'PERMANENT_FAILURE',
        message: 'Orthanc rejected this character update. Review or discard it.',
        retryable: false,
      }
}

function preservePreviousDetails(value) {
  try {
    return normalizePreparedFigurantDraft(value)
  } catch {
    return clone(value)
  }
}

function defaultIsOnline() {
  return globalThis.navigator?.onLine !== false
}

function defaultAddOnlineListener(listener) {
  globalThis.addEventListener?.('online', listener)
  return () => globalThis.removeEventListener?.('online', listener)
}

export function createDetailsOutbox({
  storage,
  sendDetails,
  onSynced = async () => {},
  now = () => Date.now(),
  isOnline = defaultIsOnline,
  addOnlineListener = defaultAddOnlineListener,
  schedule = (callback, delay) => setTimeout(callback, delay),
  cancelSchedule = (timer) => clearTimeout(timer),
  retryBaseMs = DEFAULT_RETRY_BASE_MS,
  retryMaxMs = DEFAULT_RETRY_MAX_MS,
  writeTimeoutMs = DEFAULT_WRITE_TIMEOUT_MS,
} = {}) {
  if (!storage) throw new TypeError('Details outbox storage is required.')
  if (typeof sendDetails !== 'function') {
    throw new TypeError('A character-details sender is required.')
  }

  let items = []
  let initialized = false
  let initializePromise = null
  let syncPromise = null
  let retryTimer = null
  let removeOnlineListener = null
  let notification = null
  let notificationId = 0
  const listeners = new Set()

  function snapshot() {
    const orderedItems = [...items].sort(
      (left, right) => left.createdAt - right.createdAt,
    )
    return clone({
      initialized,
      online: isOnline(),
      syncing: orderedItems.some((item) => item.status === 'syncing'),
      pendingCount: orderedItems.filter((item) => item.status !== 'failed').length,
      failedCount: orderedItems.filter((item) => item.status === 'failed').length,
      items: orderedItems,
      notification,
    })
  }

  function emit() {
    const state = snapshot()
    for (const listener of listeners) listener(state)
  }

  function clearRetryTimer() {
    if (retryTimer !== null) cancelSchedule(retryTimer)
    retryTimer = null
  }

  function scheduleNextRetry() {
    clearRetryTimer()
    if (!isOnline()) return
    const nextAttemptAt = items
      .filter((item) => item.status === 'pending')
      .reduce(
        (earliest, item) => Math.min(earliest, item.nextAttemptAt ?? 0),
        Number.POSITIVE_INFINITY,
      )
    if (!Number.isFinite(nextAttemptAt)) return
    retryTimer = schedule(() => {
      retryTimer = null
      void syncNow()
    }, Math.max(0, nextAttemptAt - now()))
  }

  async function start() {
    if (initialized) return snapshot()
    if (initializePromise) return initializePromise

    initializePromise = (async () => {
      items = (await storage.listDetailsChanges()).map((item) => ({
        ...item,
        status: item.status === 'failed' ? 'failed' : 'pending',
        nextAttemptAt: item.status === 'failed' ? item.nextAttemptAt : 0,
      }))
      initialized = true
      removeOnlineListener = addOnlineListener(() => {
        emit()
        void syncNow()
      })
      emit()
      void syncNow()
      return snapshot()
    })()

    try {
      return await initializePromise
    } finally {
      initializePromise = null
    }
  }

  function subscribe(listener) {
    listeners.add(listener)
    listener(snapshot())
    return () => listeners.delete(listener)
  }

  async function enqueue({
    characterId,
    characterName,
    details,
    previousDetails,
  }) {
    await start()
    const normalizedCharacterId = normalizeIdentifier(characterId)
    const normalizedDetails = normalizePreparedFigurantDraft(details)
    const existing = items.find(
      (item) => item.characterId === normalizedCharacterId,
    )
    const timestamp = now()
    const change = {
      characterId: normalizedCharacterId,
      characterName: String(characterName ?? normalizedCharacterId),
      details: normalizedDetails,
      previousDetails:
        existing?.previousDetails ??
        preservePreviousDetails(previousDetails),
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      attempts: 0,
      nextAttemptAt: 0,
      revision: (existing?.revision ?? 0) + 1,
      status: 'pending',
      failure: null,
    }

    items = [
      ...items.filter((item) => item.characterId !== normalizedCharacterId),
      change,
    ]
    await storage.putDetailsChange(change)
    emit()
    void syncNow()
    return clone(change)
  }

  async function sendWithTimeout(change) {
    const controller = new AbortController()
    let timedOut = false
    const timer = schedule(() => {
      timedOut = true
      controller.abort()
    }, writeTimeoutMs)

    try {
      return await sendDetails(
        { characterId: change.characterId, details: change.details },
        { signal: controller.signal },
      )
    } catch (error) {
      if (timedOut) {
        throw new ApiError('The character update timed out.', {
          service: 'orthanc',
          operation: 'updateFigurantDetails',
          code: 'CLIENT_TIMEOUT',
          retryable: true,
          cause: error,
        })
      }
      throw error
    } finally {
      cancelSchedule(timer)
    }
  }

  async function processQueue() {
    if (!initialized || !isOnline()) {
      scheduleNextRetry()
      return
    }
    const completed = []

    while (isOnline()) {
      const timestamp = now()
      const change = [...items]
        .filter(
          (item) =>
            item.status === 'pending' && (item.nextAttemptAt ?? 0) <= timestamp,
        )
        .sort((left, right) => left.createdAt - right.createdAt)[0]
      if (!change) break

      const sentRevision = change.revision
      const syncing = { ...change, status: 'syncing' }
      items = items.map((item) =>
        item.characterId === change.characterId ? syncing : item,
      )
      await storage.putDetailsChange(syncing)
      emit()

      try {
        await sendWithTimeout(syncing)
        const current = items.find(
          (item) => item.characterId === change.characterId,
        )
        if (current?.revision === sentRevision) {
          try {
            await onSynced(syncing)
          } catch (error) {
            console.error('Unable to update the cached character snapshot.', error)
          }
          await storage.deleteDetailsChange(change.characterId)
          items = items.filter(
            (item) => item.characterId !== change.characterId,
          )
          completed.push(syncing)
        } else if (current) {
          const pending = { ...current, status: 'pending', nextAttemptAt: 0 }
          items = items.map((item) =>
            item.characterId === current.characterId ? pending : item,
          )
          await storage.putDetailsChange(pending)
        }
      } catch (error) {
        console.error(error)
        const current = items.find(
          (item) => item.characterId === change.characterId,
        )
        if (!current) continue
        if (current.revision !== sentRevision) {
          const pending = { ...current, status: 'pending', nextAttemptAt: 0 }
          items = items.map((item) =>
            item.characterId === current.characterId ? pending : item,
          )
          await storage.putDetailsChange(pending)
          emit()
          continue
        }

        const retryable = isRetryable(error)
        const attempts = current.attempts + 1
        const failed = {
          ...current,
          attempts,
          status: retryable ? 'pending' : 'failed',
          nextAttemptAt: retryable
            ? now() +
              Math.min(
                retryBaseMs * 2 ** Math.max(0, attempts - 1),
                retryMaxMs,
              )
            : null,
          failure: publicFailure(error, retryable),
        }
        items = items.map((item) =>
          item.characterId === current.characterId ? failed : item,
        )
        await storage.putDetailsChange(failed)
      }
      emit()
    }

    if (completed.length > 0) {
      notification = {
        id: ++notificationId,
        count: (notification?.count ?? 0) + completed.length,
        operations: [...(notification?.operations ?? []), ...completed],
      }
      emit()
    }
    scheduleNextRetry()
  }

  function syncNow() {
    if (syncPromise) return syncPromise
    syncPromise = processQueue().finally(() => {
      syncPromise = null
    })
    return syncPromise
  }

  async function retry(characterId) {
    await start()
    const id = normalizeIdentifier(characterId)
    const current = items.find((item) => item.characterId === id)
    if (!current) return null
    const pending = {
      ...current,
      status: 'pending',
      attempts: 0,
      nextAttemptAt: 0,
      failure: null,
    }
    items = items.map((item) => (item.characterId === id ? pending : item))
    await storage.putDetailsChange(pending)
    emit()
    void syncNow()
    return clone(pending)
  }

  async function retryAll() {
    await start()
    for (const item of items.filter((candidate) => candidate.status === 'failed')) {
      const pending = {
        ...item,
        status: 'pending',
        attempts: 0,
        nextAttemptAt: 0,
        failure: null,
      }
      items = items.map((candidate) =>
        candidate.characterId === item.characterId ? pending : candidate,
      )
      await storage.putDetailsChange(pending)
    }
    emit()
    void syncNow()
  }

  async function discard(characterId) {
    await start()
    const id = normalizeIdentifier(characterId)
    const current = items.find((item) => item.characterId === id)
    if (!current) return null
    if (current.status === 'syncing') {
      throw new Error('A character update cannot be discarded while being sent.')
    }
    await storage.deleteDetailsChange(id)
    items = items.filter((item) => item.characterId !== id)
    emit()
    scheduleNextRetry()
    return clone(current)
  }

  function clearNotification() {
    notification = null
    emit()
  }

  function stop() {
    clearRetryTimer()
    removeOnlineListener?.()
    removeOnlineListener = null
    initialized = false
  }

  return {
    start,
    stop,
    subscribe,
    enqueue,
    syncNow,
    retry,
    retryAll,
    discard,
    clearNotification,
    getState: snapshot,
  }
}
