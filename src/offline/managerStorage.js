const DATABASE_VERSION = 1
const SNAPSHOT_STORE = 'snapshots'
const OUTBOX_STORE = 'assignment-outbox'
const LATEST_SNAPSHOT_KEY = 'latest'

function clone(value) {
  return value === undefined ? undefined : structuredClone(value)
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve(), { once: true })
    transaction.addEventListener(
      'abort',
      () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.')),
      { once: true },
    )
    transaction.addEventListener(
      'error',
      () => reject(transaction.error ?? new Error('IndexedDB transaction failed.')),
      { once: true },
    )
  })
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), {
      once: true,
    })
    request.addEventListener(
      'error',
      () => reject(request.error ?? new Error('IndexedDB request failed.')),
      { once: true },
    )
  })
}

export function createMemoryManagerStorage({ snapshot = null, assignments = [] } = {}) {
  let currentSnapshot = clone(snapshot)
  const currentAssignments = new Map(
    assignments.map((assignment) => [assignment.characterId, clone(assignment)]),
  )

  return {
    async loadSnapshot() {
      return clone(currentSnapshot)
    },

    async saveSnapshot(value, savedAt) {
      currentSnapshot = { value: clone(value), savedAt }
    },

    async listAssignments() {
      return clone([...currentAssignments.values()])
    },

    async putAssignment(assignment) {
      currentAssignments.set(assignment.characterId, clone(assignment))
    },

    async deleteAssignment(characterId) {
      currentAssignments.delete(String(characterId))
    },
  }
}

function safeDatabaseName(scope) {
  const suffix = String(scope ?? 'live')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `figurant-management-${suffix || 'live'}`
}

export function createIndexedDbManagerStorage({
  scope = 'live',
  indexedDb = globalThis.indexedDB,
} = {}) {
  if (!indexedDb) return createMemoryManagerStorage()

  let databasePromise

  function openDatabase() {
    if (databasePromise) return databasePromise

    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDb.open(safeDatabaseName(scope), DATABASE_VERSION)
      request.addEventListener(
        'upgradeneeded',
        () => {
          const database = request.result
          if (!database.objectStoreNames.contains(SNAPSHOT_STORE)) {
            database.createObjectStore(SNAPSHOT_STORE, { keyPath: 'key' })
          }
          if (!database.objectStoreNames.contains(OUTBOX_STORE)) {
            database.createObjectStore(OUTBOX_STORE, { keyPath: 'characterId' })
          }
        },
        { once: true },
      )
      request.addEventListener('success', () => resolve(request.result), {
        once: true,
      })
      request.addEventListener(
        'error',
        () => reject(request.error ?? new Error('Unable to open IndexedDB.')),
        { once: true },
      )
    })

    return databasePromise
  }

  async function useStore(storeName, mode, operation) {
    const database = await openDatabase()
    const transaction = database.transaction(storeName, mode)
    const resultPromise = operation(transaction.objectStore(storeName))
    const [result] = await Promise.all([resultPromise, transactionDone(transaction)])
    return result
  }

  return {
    async loadSnapshot() {
      const record = await useStore(SNAPSHOT_STORE, 'readonly', (store) =>
        requestResult(store.get(LATEST_SNAPSHOT_KEY)),
      )
      return record ? { value: record.value, savedAt: record.savedAt } : null
    },

    async saveSnapshot(value, savedAt) {
      await useStore(SNAPSHOT_STORE, 'readwrite', (store) =>
        requestResult(
          store.put({ key: LATEST_SNAPSHOT_KEY, value: clone(value), savedAt }),
        ),
      )
    },

    async listAssignments() {
      return useStore(OUTBOX_STORE, 'readonly', (store) =>
        requestResult(store.getAll()),
      )
    },

    async putAssignment(assignment) {
      await useStore(OUTBOX_STORE, 'readwrite', (store) =>
        requestResult(store.put(clone(assignment))),
      )
    },

    async deleteAssignment(characterId) {
      await useStore(OUTBOX_STORE, 'readwrite', (store) =>
        requestResult(store.delete(String(characterId))),
      )
    },
  }
}
