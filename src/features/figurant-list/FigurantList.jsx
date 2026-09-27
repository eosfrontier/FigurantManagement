import { useEffect, useMemo, useRef, useState } from 'react'
import { getUserFacingError } from '../../api/errors.js'
import {
  applyAssignmentOperations,
  applyCardOperations,
  applyCreatedFigurant,
} from '../../data/figurantManager.js'
import FigurantDetailsDialog from '../figurant-details/FigurantDetailsDialog.jsx'
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

function CardControl({ figurant, enabled, queueItem, onSave }) {
  const [scanning, setScanning] = useState(false)
  const [cardId, setCardId] = useState('')
  const label = `${figurant.characterName} (${figurant.characterId})`

  useEffect(() => {
    setScanning(false)
    setCardId('')
  }, [figurant.characterId])

  async function submit(event) {
    event.preventDefault()
    const normalizedCardId = cardId.trim()
    if (!normalizedCardId || normalizedCardId === figurant.cardId) return
    const queued = await onSave(figurant, normalizedCardId)
    if (queued) {
      setCardId('')
      setScanning(false)
    }
  }

  return (
    <div className="card-control">
      <span>{figurant.cardId ?? 'No card'}</span>{' '}
      {!scanning ? (
        <button
          className="button button--compact"
          type="button"
          aria-label={`${figurant.cardId ? 'Replace' : 'Scan'} card for ${label}`}
          disabled={!enabled}
          onClick={() => setScanning(true)}
        >
          {figurant.cardId ? 'Replace card' : 'Scan card'}
        </button>
      ) : (
        <form onSubmit={submit}>
          <label>
            <span>Scan card for {label}</span>
            <input
              type="text"
              value={cardId}
              autoFocus
              autoComplete="one-time-code"
              maxLength={64}
              pattern="[A-Za-z0-9:-]+"
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => setCardId(event.currentTarget.value)}
            />
          </label>
          <button
            type="submit"
            className="button button--compact"
            disabled={!cardId.trim() || cardId.trim() === figurant.cardId}
          >
            Queue card
          </button>
          <button
            type="button"
            className="button button--compact button--quiet"
            onClick={() => {
              setCardId('')
              setScanning(false)
            }}
          >
            Cancel
          </button>
        </form>
      )}
      {queueItem && (
        <span role="status">
          {' '}
          {queueItem.status === 'failed'
            ? 'Needs attention.'
            : queueItem.status === 'syncing'
              ? 'Syncing...'
              : 'Queued.'}
        </span>
      )}
    </div>
  )
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
        className="button button--compact"
        type="button"
        aria-label={`Queue assignment for ${label}`}
        disabled={!enabled || selectedValue === currentValue}
        onClick={() =>
          onSave(figurant, selectedValue === '' ? null : selectedValue)
        }
      >
        Queue
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
    <section
      className="sync-card assignment-queue"
      aria-labelledby="assignment-queue-title"
    >
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
          <button
            className="button button--compact button--quiet"
            type="button"
            onClick={outbox.clearNotification}
          >
            Dismiss synchronization message
          </button>
        </div>
      )}

      {state.pendingCount > 0 && (
        <button
          className="button button--compact"
          type="button"
          onClick={() => void outbox.syncNow()}
        >
          Try queued changes now
        </button>
      )}
      {state.failedCount > 0 && (
        <button
          className="button button--compact"
          type="button"
          onClick={() => perform(outbox.retryAll)}
        >
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
                <button
                  className="button button--compact"
                  type="button"
                  onClick={() =>
                    perform(() => outbox.retry(item.characterId))
                  }
                >
                  Retry {item.characterName}
                </button>
              )}
              {item.status !== 'syncing' && (
                <button
                  type="button"
                  className="button button--compact button--danger"
                  onClick={() => perform(() => outbox.discard(item.characterId))}
                >
                  Discard queued change for {item.characterName}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {state.items.length > 0 && (
        <p className="sync-card__note">
          Discarding stops future retries but cannot undo a request already
          received.
        </p>
      )}
    </section>
  )
}

function CardSynchronizationQueue({ state, outbox, onError }) {
  if (!outbox) return null

  async function perform(action) {
    try {
      await action()
    } catch (error) {
      console.error(error)
      onError('The card queue could not be updated.')
    }
  }

  return (
    <section className="sync-card card-queue" aria-labelledby="card-queue-title">
      <h3 id="card-queue-title">Card synchronization</h3>
      <p role="status">
        {state.pendingCount} card changes queued; {state.failedCount} need attention.
        {!state.online && ' Offline.'}
      </p>

      {state.notification && (
        <div role="status">
          <p>
            {state.notification.count}{' '}
            {state.notification.count === 1 ? 'card' : 'cards'} synchronized.
          </p>
          <button
            className="button button--compact button--quiet"
            type="button"
            onClick={outbox.clearNotification}
          >
            Dismiss card message
          </button>
        </div>
      )}

      {state.pendingCount > 0 && (
        <button
          className="button button--compact"
          type="button"
          onClick={() => void outbox.syncNow()}
        >
          Sync cards now
        </button>
      )}
      {state.failedCount > 0 && (
        <button
          className="button button--compact"
          type="button"
          onClick={() => perform(outbox.retryAll)}
        >
          Retry failed cards
        </button>
      )}

      {state.items.length > 0 && (
        <ul>
          {state.items.map((item) => (
            <li key={item.characterId}>
              {item.characterName}: {item.cardId} -{' '}
              {item.status === 'failed'
                ? item.failure?.message
                : item.status === 'syncing'
                  ? 'Syncing...'
                  : 'Queued.'}
              {item.status === 'failed' && (
                <button
                  type="button"
                  className="button button--compact"
                  onClick={() => perform(() => outbox.retry(item.characterId))}
                >
                  Retry {item.characterName} card
                </button>
              )}
              {item.status !== 'syncing' && (
                <button
                  type="button"
                  className="button button--compact button--danger"
                  onClick={() => perform(() => outbox.discard(item.characterId))}
                >
                  Discard {item.characterName} card change
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function FigurantList({ manager, mutationsEnabled = false }) {
  const [state, setState] = useState({ status: 'idle' })
  const [outboxState, setOutboxState] = useState(EMPTY_OUTBOX_STATE)
  const [cardOutboxState, setCardOutboxState] = useState(EMPTY_OUTBOX_STATE)
  const [queueError, setQueueError] = useState(null)
  const [cardQueueError, setCardQueueError] = useState(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creationMessage, setCreationMessage] = useState(null)
  const [filters, setFilters] = useState({})
  const [sortKey, setSortKey] = useState('characterName')
  const [sortDirection, setSortDirection] = useState('asc')
  const requestId = useRef(0)
  const activeController = useRef(null)
  const handledNotification = useRef(null)
  const handledCardNotification = useRef(null)
  const outbox = mutationsEnabled ? manager.outbox : null
  const cardOutbox = mutationsEnabled ? manager.cardOutbox : null

  async function acceptCreatedFigurant(creation) {
    setState((current) => {
      if (!current.result) return current
      return {
        ...current,
        result: applyCreatedFigurant(current.result, creation.figurant),
      }
    })
    setCreateDialogOpen(false)
    setCreationMessage(
      `${creation.figurant.characterName} was created as character ${creation.characterId}.`,
    )
  }

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
    if (!cardOutbox) return undefined
    const unsubscribe = cardOutbox.subscribe(setCardOutboxState)
    cardOutbox.start().catch((error) => {
      console.error(error)
      setCardQueueError('The durable card queue could not be opened.')
    })
    return () => {
      unsubscribe()
      cardOutbox.stop()
    }
  }, [cardOutbox])

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

  useEffect(() => {
    const completed = cardOutboxState.notification
    if (!completed || handledCardNotification.current === completed.id) return
    handledCardNotification.current = completed.id
    setState((current) =>
      current.status === 'success' || current.status === 'refreshing'
        ? {
            ...current,
            result: applyCardOperations(current.result, completed.operations),
          }
        : current,
    )
  }, [cardOutboxState.notification])

  const baseResult =
    state.status === 'success' || state.status === 'refreshing'
      ? state.result
      : null
  const displayedResult = useMemo(() => {
    if (!baseResult) return null
    const completedOperations = outboxState.notification?.operations ?? []
    const completedCardOperations =
      cardOutboxState.notification?.operations ?? []
    return applyCardOperations(
      applyCardOperations(
        applyAssignmentOperations(
          applyAssignmentOperations(baseResult, completedOperations),
          outboxState.items,
        ),
        completedCardOperations,
      ),
      cardOutboxState.items,
    )
  }, [
    baseResult,
    cardOutboxState.items,
    cardOutboxState.notification,
    outboxState.items,
    outboxState.notification,
  ])

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

  async function saveCard(figurant, cardId) {
    if (!cardOutbox || cardQueueError) return false
    try {
      await cardOutbox.enqueue({
        characterId: figurant.characterId,
        characterName: figurant.characterName,
        cardId,
      })
      return true
    } catch (error) {
      console.error(error)
      setCardQueueError('The card could not be queued. Check the scanned value.')
      return false
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
      <div className="figurant-list__heading">
        <div>
          <p className="eyebrow">Active roster</p>
          <h2 id="figurant-list-title">Current figurant characters</h2>
          <p className="section-intro">
            Assign crew or scan a card directly from its character row.
          </p>
        </div>
        <div className="figurant-list__actions">
          <button
            className="button button--primary"
            type="button"
            disabled={!mutationsEnabled}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create character
          </button>
          <button
            className="button button--quiet"
            type="button"
            onClick={load}
            disabled={state.status === 'loading' || state.status === 'refreshing'}
          >
            {state.status === 'loading' || state.status === 'refreshing'
              ? 'Loading...'
              : 'Refresh characters'}
          </button>
        </div>
      </div>
      <p className="scope-note">
        {mutationsEnabled
          ? 'Creation, assignment, and card changes are enabled for the current data source. Editing existing character details and deletion are not yet available.'
          : 'This roster is read-only. Editing existing character details and deletion are not yet available.'}
      </p>
      {!mutationsEnabled && (
        <p>
          Assignment and card controls are disabled. Live mutations require an
          explicit development or authorized-deployment opt-in.
        </p>
      )}
      {queueError && (
        <div className="alert alert--error" role="alert">
          <p>{queueError}</p>
          <button
            className="button button--compact"
            type="button"
            onClick={() => setQueueError(null)}
          >
            Dismiss queue error
          </button>
        </div>
      )}

      {cardQueueError && (
        <div className="alert alert--error" role="alert">
          <p>{cardQueueError}</p>
          <button
            className="button button--compact"
            type="button"
            onClick={() => setCardQueueError(null)}
          >
            Dismiss card queue error
          </button>
        </div>
      )}

      {creationMessage && (
        <div className="alert alert--success" role="status">
          <p>{creationMessage}</p>
          <button
            className="button button--compact button--quiet"
            type="button"
            onClick={() => setCreationMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {mutationsEnabled && (
        <div className="sync-grid">
          <SynchronizationQueue
            state={outboxState}
            outbox={outbox}
            onError={setQueueError}
          />
          <CardSynchronizationQueue
            state={cardOutboxState}
            outbox={cardOutbox}
            onError={setCardQueueError}
          />
        </div>
      )}

      {state.status === 'idle' && <p>Characters have not been requested yet.</p>}
      {state.status === 'loading' && (
        <p role="status">Loading characters from the selected data source...</p>
      )}
      {state.status === 'refreshing' && (
        <p role="status">Refreshing characters in the background...</p>
      )}
      {state.status === 'error' && (
        <div className="alert alert--error" role="alert">
          <p>{state.message}</p>
          <button className="button button--compact" type="button" onClick={load}>
            Try again
          </button>
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
          <p className="result-summary" role="status">
            Showing {visibleFigurants.length} of {displayedResult.items.length} characters.
            {' '}{displayedResult.duplicateRows} duplicate API rows were removed.
          </p>
          {displayedResult.warnings.map((warning) => (
            <p key={warning.code}>{warning.message}</p>
          ))}

          {displayedResult.items.length === 0 ? (
            <p>No active figurant characters were returned.</p>
          ) : (
            <div className="table-scroll">
              <table className="figurant-table">
                <thead>
                  <tr>
                    {figurantColumns.map((column) => (
                      <th key={column.key} scope="col">
                        <button
                          className="sort-button"
                          type="button"
                          onClick={() => sortBy(column.key)}
                        >
                          <span>{column.label}</span>
                          {sortKey === column.key
                            ? sortDirection === 'asc'
                              ? ' ↑'
                              : ' ↓'
                            : ''}
                        </button>
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {figurantColumns.map((column) => (
                      <th key={column.key} scope="col">
                        <label>
                          <span className="visually-hidden">
                            Filter {column.label}
                          </span>
                          <input
                            aria-label={`Filter ${column.label}`}
                            placeholder="Filter…"
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
                  const assignmentQueueItem = outboxState.items.find(
                    (item) => item.characterId === figurant.characterId,
                  )
                  const cardQueueItem = cardOutboxState.items.find(
                    (item) => item.characterId === figurant.characterId,
                  )
                  return (
                    <tr key={figurant.characterId}>
                      {figurantColumns.map((column) => (
                        <td
                          key={column.key}
                          className={
                            column.key === 'factionId'
                              ? `faction-cell faction-cell--${figurant.factionId}`
                              : undefined
                          }
                        >
                          {column.key === 'cardId' ? (
                            <CardControl
                              figurant={figurant}
                              enabled={
                                mutationsEnabled &&
                                Boolean(cardOutbox) &&
                                !cardQueueError
                              }
                              queueItem={cardQueueItem}
                              onSave={saveCard}
                            />
                          ) : column.key === 'assignedDisplayName' ? (
                            <AssignmentControl
                              figurant={figurant}
                              users={displayedResult.assignableUsers ?? []}
                              enabled={mutationsEnabled && Boolean(outbox) && !queueError}
                              queueItem={assignmentQueueItem}
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
            </div>
          )}

          {displayedResult.items.length > 0 && visibleFigurants.length === 0 && (
            <p>No characters match the active filters.</p>
          )}
        </>
      )}

      <FigurantDetailsDialog
        open={createDialogOpen}
        manager={manager}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={acceptCreatedFigurant}
      />
    </section>
  )
}
