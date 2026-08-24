import { ApiError } from '../api/errors.js'

const DEFAULT_RETRY_BASE_MS = 2_000
const DEFAULT_RETRY_MAX_MS = 60_000
const DEFAULT_WRITE_TIMEOUT_MS = 15_000

function clone(value) {
  return value === undefined ? undefined : structuredClone(value)
}

function normalizeIdentifier(value, field) {
  const identifier = String(value ?? '').trim()
  if (!/^[1-9]\d*$/.test(identifier)) {
    throw new TypeError(`${field} must be a positive numeric identifier.`)
  }
  return identifier
}

function normalizeAssignment(value) {
  return value === null
    ? null
    : normalizeIdentifier(value, 'assignedExternalUserId')
}

function isRetryable(error) {
  if (typeof error?.retryable === 'boolean') return error.retryable
  if (error?.name === 'ContractError' || error instanceof TypeError) return false
  return true
}

function publicFailure(error, retryable) {
  if (retryable) {
    return {
      code: error?.code ?? 'TEMPORARY_FAILURE',
      message: 'Waiting for the service to become available.',
      retryable: true,
    }
  }

  return {
    code: error?.code ?? 'PERMANENT_FAILURE',
    message: 'Orthanc rejected this assignment. Review or discard it.',
    retryable: false,
  }
}

function retryDelay(attempts, baseMs, maxMs) {
  return Math.min(baseMs * 2 ** Math.max(0, attempts - 1), maxMs)
}

function defaultIsOnline() {
  return globalThis.navigator?.onLine !== false
}

function defaultAddOnlineListener(listener) {
  globalThis.addEventListener?.('online', listener)
  return () => globalThis.removeEventListener?.('online', listener)
}

export function createAssignmentOutbox({
  storage,
  sendAssignment,
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
  if (!storage) throw new TypeError('Assignment outbox storage is required.')
  if (typeof sendAssignment !== 'function') {
    throw new TypeError('An assignment sender is required.')
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
      const storedItems = await storage.listAssignments()
      items = storedItems.map((item) => ({
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
    assignedExternalUserId,
    assignedDisplayName = null,
    previousAssignedExternalUserId = null,
    previousAssignedDisplayName = null,
  }) {
    await start()
    const normalizedCharacterId = normalizeIdentifier(characterId, 'characterId')
    const existing = items.find(
      (item) => item.characterId === normalizedCharacterId,
    )
    const timestamp = now()
    const assignment = {
      characterId: normalizedCharacterId,
      characterName: String(characterName ?? normalizedCharacterId),
      assignedExternalUserId: normalizeAssignment(assignedExternalUserId),
      assignedDisplayName:
        assignedExternalUserId === null
          ? null
          : String(assignedDisplayName ?? '').trim() || null,
      previousAssignedExternalUserId:
        existing?.previousAssignedExternalUserId ??
        normalizeAssignment(previousAssignedExternalUserId),
      previousAssignedDisplayName:
        existing?.previousAssignedDisplayName ??
        (previousAssignedExternalUserId === null
          ? null
          : String(previousAssignedDisplayName ?? '').trim() || null),
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
      assignment,
    ]
    await storage.putAssignment(assignment)
    emit()
    void syncNow()
    return clone(assignment)
  }

  async function sendWithTimeout(assignment) {
    const controller = new AbortController()
    let timedOut = false
    const timer = schedule(() => {
      timedOut = true
      controller.abort()
    }, writeTimeoutMs)

    try {
      return await sendAssignment(
        {
          characterId: assignment.characterId,
          assignedExternalUserId: assignment.assignedExternalUserId,
        },
        { signal: controller.signal },
      )
    } catch (error) {
      if (timedOut) {
        throw new ApiError('The assignment request timed out.', {
          service: 'orthanc',
          operation: 'setFigurantAssignment',
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
      const assignment = [...items]
        .filter(
          (item) =>
            item.status === 'pending' && (item.nextAttemptAt ?? 0) <= timestamp,
        )
        .sort((left, right) => left.createdAt - right.createdAt)[0]

      if (!assignment) break

      const sentRevision = assignment.revision
      const syncingAssignment = { ...assignment, status: 'syncing' }
      items = items.map((item) =>
        item.characterId === assignment.characterId
          ? syncingAssignment
          : item,
      )
      await storage.putAssignment(syncingAssignment)
      emit()

      try {
        await sendWithTimeout(syncingAssignment)
        const current = items.find(
          (item) => item.characterId === assignment.characterId,
        )

        if (current?.revision === sentRevision) {
          try {
            await onSynced(syncingAssignment)
          } catch (error) {
            console.error('Unable to update the cached assignment snapshot.', error)
          }
          await storage.deleteAssignment(assignment.characterId)
          items = items.filter(
            (item) => item.characterId !== assignment.characterId,
          )
          completed.push(syncingAssignment)
        } else if (current) {
          const pendingCurrent = {
            ...current,
            status: 'pending',
            nextAttemptAt: 0,
          }
          items = items.map((item) =>
            item.characterId === current.characterId ? pendingCurrent : item,
          )
          await storage.putAssignment(pendingCurrent)
        }
      } catch (error) {
        console.error(error)
        const current = items.find(
          (item) => item.characterId === assignment.characterId,
        )
        if (!current) continue

        if (current.revision !== sentRevision) {
          const pendingCurrent = {
            ...current,
            status: 'pending',
            nextAttemptAt: 0,
          }
          items = items.map((item) =>
            item.characterId === current.characterId ? pendingCurrent : item,
          )
          await storage.putAssignment(pendingCurrent)
          emit()
          continue
        }

        const retryable = isRetryable(error)
        const attempts = current.attempts + 1
        const failedAssignment = {
          ...current,
          attempts,
          status: retryable ? 'pending' : 'failed',
          nextAttemptAt: retryable
            ? now() + retryDelay(attempts, retryBaseMs, retryMaxMs)
            : null,
          failure: publicFailure(error, retryable),
        }
        items = items.map((item) =>
          item.characterId === current.characterId ? failedAssignment : item,
        )
        await storage.putAssignment(failedAssignment)
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
    const normalizedCharacterId = normalizeIdentifier(characterId, 'characterId')
    const current = items.find(
      (item) => item.characterId === normalizedCharacterId,
    )
    if (!current) return null

    const pending = {
      ...current,
      status: 'pending',
      attempts: 0,
      nextAttemptAt: 0,
      failure: null,
    }
    items = items.map((item) =>
      item.characterId === normalizedCharacterId ? pending : item,
    )
    await storage.putAssignment(pending)
    emit()
    void syncNow()
    return clone(pending)
  }

  async function retryAll() {
    await start()
    const failed = items.filter((item) => item.status === 'failed')
    for (const item of failed) {
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
      await storage.putAssignment(pending)
    }
    emit()
    void syncNow()
  }

  async function discard(characterId) {
    await start()
    const normalizedCharacterId = normalizeIdentifier(characterId, 'characterId')
    const current = items.find(
      (item) => item.characterId === normalizedCharacterId,
    )
    if (!current) return null
    if (current.status === 'syncing') {
      throw new Error('An assignment cannot be discarded while it is being sent.')
    }

    await storage.deleteAssignment(normalizedCharacterId)
    items = items.filter((item) => item.characterId !== normalizedCharacterId)
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
