import { useEffect, useMemo, useRef, useState } from 'react'
import { getUserFacingError } from '../../api/errors.js'
import { applyAssignmentOperations } from '../../data/figurantManager.js'
import {
  figurantColumns,
  formatFigurantCell,
  getVisibleFigurants,
} from './figurantTable.js'

const EMPTY_OUTBOX_STATE = {
  initialized: false,
  online: true,
  syncing: false,
  pendingCount: 0,
  failedCount: 0,
  items: [],
  notification: null,
}

function AssignmentControl({ figurant, users, enabled, queueItem, onSave }) {
  const currentValue = figurant.assignedExternalUserId ?? ''
  const [selectedValue, setSelectedValue] = useState(currentValue)

  useEffect(() => {
    setSelectedValue(currentValue)
  }, [currentValue, figurant.characterId])

  const currentUserIsMissing =
    currentValue &&
    !users.some((user) => user.externalUserId === currentValue)
  const label = `${figurant.characterName} (${figurant.characterId})`

  return (
    <div className="assignment-control">
      <label>
        <span>Assignment for {label}</span>
        <select
          aria-label={`Assignment for ${label}`}
          value={selectedValue}
          disabled={!enabled}
          onChange={(event) => setSelectedValue(event.currentTarget.value)}
        >
          <option value="">Unassigned</option>
          {currentUserIsMissing && (
            <option value={currentValue}>
              {figurant.assignedDisplayName ?? `User ${currentValue}`} (currently assigned)
            </option>
          )}
          {users.map((user) => (
            <option key={user.externalUserId} value={user.externalUserId}>
              {user.displayName}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={!enabled || selectedValue === currentValue}
        onClick={() =>
          onSave(figurant, selectedValue === '' ? null : selectedValue)
        }
      >
        Queue assignment for {label}
      </button>
      {queueItem && (
        <span role="status">
          {' '}
          {queueItem.status === 'failed'
            ? 'Needs attention.'
            : queueItem.status === 'syncing'
              ? 'Synchronizing...'
              : 'Pending synchronization.'}
        </span>
      )}
    </div>
  )
}

function SynchronizationQueue({ state, outbox, onError }) {
  if (!outbox) return null

  async function perform(action) {
    try {
      await action()
    } catch (error) {
      console.error(error)
      onError('The synchronization queue could not be updated.')
    }
  }

  return (
    <section className="assignment-queue" aria-labelledby="assignment-queue-title">
      <h3 id="assignment-queue-title">Assignment synchronization</h3>
      <p role="status">
        {state.pendingCount} assignment changes waiting to synchronize;{' '}
        {state.failedCount} need attention.
        {!state.online && ' This browser currently reports that it is offline.'}
      </p>

      {state.notification && (
        <div role="status">
          <p>
            {state.notification.count}{' '}
            {state.notification.count === 1 ? 'assignment' : 'assignments'} synchronized.
          </p>
          <button type="button" onClick={outbox.clearNotification}>
            Dismiss synchronization message
          </button>
        </div>
      )}

      {state.pendingCount > 0 && (
        <button type="button" onClick={() => void outbox.syncNow()}>
          Try queued changes now
        </button>
      )}
      {state.failedCount > 0 && (
        <button type="button" onClick={() => perform(outbox.retryAll)}>
          Retry all changes needing attention
        </button>
      )}

      {state.items.length > 0 && (
        <ul>
          {state.items.map((item) => (
            <li key={item.characterId}>
              {item.characterName}: {item.assignedDisplayName ?? 'Unassigned'} -{' '}
              {item.status === 'failed'
                ? item.failure?.message
                : item.status === 'syncing'
                  ? 'Synchronizing...'
                  : 'Waiting to synchronize.'}
              {item.status === 'failed' && (
                <button type="button" onClick={() => perform(() => outbox.retry(item.characterId))}>
                  Retry {item.characterName}
                </button>
              )}
              {item.status !== 'syncing' && (
                <button
                  type="button"
                  onClick={() => perform(() => outbox.discard(item.characterId))}
                >
                  Discard queued change for {item.characterName}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p>
        Discarding a queued change only stops future retries. It cannot undo a
        request Orthanc may already have received.
      </p>
    </section>
  )
}

export default function FigurantList({ manager, mutationsEnabled = false }) {
  const [state, setState] = useState({ status: 'idle' })
  const [outboxState, setOutboxState] = useState(EMPTY_OUTBOX_STATE)
  const [queueError, setQueueError] = useState(null)
  const [filters, setFilters] = useState({})
  const [sortKey, setSortKey] = useState('characterName')
  const [sortDirection, setSortDirection] = useState('asc')
  const requestId = useRef(0)
  const activeController = useRef(null)
  const handledNotification = useRef(null)
  const outbox = mutationsEnabled ? manager.outbox : null

  async function load() {
    activeController.current?.abort()
    const controller = new AbortController()
    const currentRequest = ++requestId.current
    activeController.current = controller
    setState((current) =>
      current.status === 'success' || current.status === 'refreshing'
        ? { ...current, status: 'refreshing' }
        : { status: 'loading' },
    )

    try {
      const result = await manager.loadFigurants({ signal: controller.signal })
      if (requestId.current === currentRequest) {
        setState({ status: 'success', result })
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      console.error(error)
      if (requestId.current === currentRequest) {
        setState({ status: 'error', message: getUserFacingError(error) })
      }
    } finally {
      if (requestId.current === currentRequest) activeController.current = null
    }
  }

  useEffect(() => {
    load()
    return () => {
      requestId.current += 1
      activeController.current?.abort()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!outbox) return undefined
    const unsubscribe = outbox.subscribe(setOutboxState)
    outbox.start().catch((error) => {
      console.error(error)
      setQueueError(
        'The durable synchronization queue could not be opened. Assignment controls are unavailable.',
      )
    })
    return () => {
      unsubscribe()
      outbox.stop()
    }
  }, [outbox])

  useEffect(() => {
    const completed = outboxState.notification
    if (!completed || handledNotification.current === completed.id) return
    handledNotification.current = completed.id
    setState((current) =>
      current.status === 'success' || current.status === 'refreshing'
        ? {
            ...current,
            result: applyAssignmentOperations(
              current.result,
              completed.operations,
            ),
          }
        : current,
    )
  }, [outboxState.notification])

  const baseResult =
    state.status === 'success' || state.status === 'refreshing'
      ? state.result
      : null
  const displayedResult = useMemo(() => {
    if (!baseResult) return null
    const completedOperations = outboxState.notification?.operations ?? []
    return applyAssignmentOperations(
      applyAssignmentOperations(baseResult, completedOperations),
      outboxState.items,
    )
  }, [baseResult, outboxState.items, outboxState.notification])

  async function saveAssignment(figurant, assignedExternalUserId) {
    if (!outbox || queueError) return
    const assignedUser =
      assignedExternalUserId === null
        ? null
        : displayedResult?.assignableUsers?.find(
            (user) => user.externalUserId === assignedExternalUserId,
          )

    try {
      await outbox.enqueue({
        characterId: figurant.characterId,
        characterName: figurant.characterName,
        assignedExternalUserId,
        assignedDisplayName: assignedUser?.displayName ?? null,
        previousAssignedExternalUserId: figurant.assignedExternalUserId,
        previousAssignedDisplayName: figurant.assignedDisplayName,
      })
    } catch (error) {
      console.error(error)
      setQueueError(
        'The assignment could not be saved to the durable queue. Please try again.',
      )
    }
  }

  const visibleFigurants = useMemo(
    () =>
      displayedResult
        ? getVisibleFigurants(
            displayedResult.items,
            filters,
            sortKey,
            sortDirection,
          )
        : [],
    [displayedResult, filters, sortDirection, sortKey],
  )

  function sortBy(key) {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="figurant-list" aria-labelledby="figurant-list-title">
      <h2 id="figurant-list-title">Current figurant characters</h2>
      <p>Card scanning, character editing and deletion are not enabled.</p>
      {!mutationsEnabled && (
        <p>
          Assignment controls are disabled. Live mutations require an explicit
          development or authorized-deployment opt-in.
        </p>
      )}
      <button
        type="button"
        onClick={load}
        disabled={state.status === 'loading' || state.status === 'refreshing'}
      >
        {state.status === 'loading' || state.status === 'refreshing'
          ? 'Loading...'
          : 'Refresh characters'}
      </button>

      {queueError && (
        <div role="alert">
          <p>{queueError}</p>
          <button type="button" onClick={() => setQueueError(null)}>
            Dismiss queue error
          </button>
        </div>
      )}

      {mutationsEnabled && (
        <SynchronizationQueue
          state={outboxState}
          outbox={outbox}
          onError={setQueueError}
        />
      )}

      {state.status === 'idle' && <p>Characters have not been requested yet.</p>}
      {state.status === 'loading' && (
        <p role="status">Loading characters from the selected data source...</p>
      )}
      {state.status === 'refreshing' && (
        <p role="status">Refreshing characters in the background...</p>
      )}
      {state.status === 'error' && (
        <div role="alert">
          <p>{state.message}</p>
          <button type="button" onClick={load}>Try again</button>
        </div>
      )}

      {displayedResult && (
        <>
          {displayedResult.cacheInfo?.source === 'cache' && (
            <p role="status">
              {displayedResult.cacheInfo.reason} Snapshot saved{' '}
              {new Date(displayedResult.cacheInfo.savedAt).toLocaleString()}.
            </p>
          )}
          <p role="status">
            Showing {visibleFigurants.length} of {displayedResult.items.length} characters.
            {' '}{displayedResult.duplicateRows} duplicate API rows were removed.
          </p>
          {displayedResult.warnings.map((warning) => (
            <p key={warning.code}>{warning.message}</p>
          ))}

          {displayedResult.items.length === 0 ? (
            <p>No active figurant characters were returned.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  {figurantColumns.map((column) => (
                    <th key={column.key} scope="col">
                      <button type="button" onClick={() => sortBy(column.key)}>
                        {column.label}
                        {sortKey === column.key
                          ? sortDirection === 'asc'
                            ? ' ascending'
                            : ' descending'
                          : ''}
                      </button>
                    </th>
                  ))}
                </tr>
                <tr>
                  {figurantColumns.map((column) => (
                    <th key={column.key} scope="col">
                      <label>
                        <span>Filter {column.label}</span>
                        <input
                          aria-label={`Filter ${column.label}`}
                          value={filters[column.key] ?? ''}
                          onChange={(event) =>
                            setFilter(column.key, event.currentTarget.value)
                          }
                        />
                      </label>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleFigurants.map((figurant) => {
                  const queueItem = outboxState.items.find(
                    (item) => item.characterId === figurant.characterId,
                  )
                  return (
                    <tr key={figurant.characterId}>
                      {figurantColumns.map((column) => (
                        <td key={column.key}>
                          {column.key === 'assignedDisplayName' ? (
                            <AssignmentControl
                              figurant={figurant}
                              users={displayedResult.assignableUsers ?? []}
                              enabled={mutationsEnabled && Boolean(outbox) && !queueError}
                              queueItem={queueItem}
                              onSave={saveAssignment}
                            />
                          ) : (
                            formatFigurantCell(figurant, column.key)
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {displayedResult.items.length > 0 && visibleFigurants.length === 0 && (
            <p>No characters match the active filters.</p>
          )}
        </>
      )}
    </section>
  )
}
