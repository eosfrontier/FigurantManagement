import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../../Icon.jsx'
import { getUserFacingError } from '../../api/errors.js'
import {
  applyAssignmentOperations,
  applyCardOperations,
  applyCreatedFigurant,
  applyDeletedFigurant,
  applyDetailsOperations,
} from '../../data/figurantManager.js'
import { figurantToEditableDetails } from '../../domain/figurantDraft.js'
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

const DEFAULT_PAGE_SIZE = 25
const PAGE_SIZE_OPTIONS = [25, 50, 100]

function PaginationControls({
  page,
  pageCount,
  pageSize,
  placement,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalItems === 0) return null
  const firstItem = page * pageSize + 1
  const lastItem = Math.min((page + 1) * pageSize, totalItems)

  return (
    <nav className="roster-pagination" aria-label={`Roster pagination ${placement}`}>
      <span className="roster-pagination__range">
        {firstItem}–{lastItem} of {totalItems}
      </span>
      <label className="roster-pagination__size">
        <span>Rows</span>
        <select
          aria-label={`Rows per page ${placement}`}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.currentTarget.value))}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
      <div className="roster-pagination__navigation">
        <button type="button" className="button button--compact" aria-label="First page" title="First page" disabled={page === 0} onClick={() => onPageChange(0)}>«</button>
        <button type="button" className="button button--compact" aria-label="Previous page" title="Previous page" disabled={page === 0} onClick={() => onPageChange(page - 1)}>‹</button>
        <span>Page {page + 1} of {pageCount}</span>
        <button type="button" className="button button--compact" aria-label="Next page" title="Next page" disabled={page >= pageCount - 1} onClick={() => onPageChange(page + 1)}>›</button>
        <button type="button" className="button button--compact" aria-label="Last page" title="Last page" disabled={page >= pageCount - 1} onClick={() => onPageChange(pageCount - 1)}>»</button>
      </div>
    </nav>
  )
}

function FigurantPhoto({ figurant, photoBaseUrl }) {
  const [useFallback, setUseFallback] = useState(false)
  const assignedUserId = figurant.assignedExternalUserId

  useEffect(() => {
    setUseFallback(false)
  }, [assignedUserId, photoBaseUrl])

  if (!photoBaseUrl || !assignedUserId) {
    return (
      <span className="figurant-photo figurant-photo--placeholder" title="No NPC photo">
        <span aria-hidden="true">—</span>
        <span className="visually-hidden">No NPC photo</span>
      </span>
    )
  }

  const fileName = useFallback ? 'default.jpg' : `${encodeURIComponent(assignedUserId)}.jpg`
  const displayName = figurant.assignedDisplayName ?? `user ${assignedUserId}`

  return (
    <img
      className="figurant-photo"
      src={`${photoBaseUrl}/img/passphoto/npc/${fileName}`}
      alt={`NPC photo of ${displayName}`}
      loading="lazy"
      onError={useFallback ? undefined : () => setUseFallback(true)}
    />
  )
}

function RecurringControl({ figurant, enabled, pending, onChange }) {
  return (
    <input
      className="recurring-control"
      type="checkbox"
      aria-label={`Recurring character for ${figurant.characterName} (${figurant.characterId})`}
      title={pending ? 'Queued for synchronization' : 'Recurring character'}
      checked={figurant.recurring}
      disabled={!enabled}
      onChange={(event) => onChange(figurant, event.currentTarget.checked)}
    />
  )
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
          className="button button--compact icon-button"
          type="button"
          aria-label={`${figurant.cardId ? 'Replace' : 'Scan'} card for ${label}`}
          title={figurant.cardId ? 'Replace card' : 'Scan card'}
          disabled={!enabled}
          onClick={() => setScanning(true)}
        >
          <Icon name="card" size={16} />
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

  async function changeAssignment(event) {
    const nextValue = event.currentTarget.value
    setSelectedValue(nextValue)
    const queued = await onSave(figurant, nextValue === '' ? null : nextValue)
    if (!queued) setSelectedValue(currentValue)
  }

  return (
    <div className="assignment-control">
      <label>
        <span>Assignment for {label}</span>
        <select
          aria-label={`Assignment for ${label}`}
          value={selectedValue}
          disabled={!enabled}
          onChange={changeAssignment}
        >
          <option value="">Unassigned</option>
          {currentUserIsMissing && (
            <option value={currentValue}>
              {figurant.assignedDisplayName ?? `User ${currentValue}`} (currently assigned)
            </option>
          )}
          {users.map((user, index) => (
            <option key={`${user.externalUserId}-${user.displayName}-${index}`} value={user.externalUserId}>
              {user.displayName}
            </option>
          ))}
        </select>
      </label>
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
        {state.pendingCount} assignment {state.pendingCount === 1 ? 'change' : 'changes'} waiting to synchronize;{' '}
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

function DetailsSynchronizationQueue({ state, outbox, onError }) {
  if (!outbox) return null

  async function perform(action) {
    try {
      await action()
    } catch (error) {
      console.error(error)
      onError('The character update queue could not be updated.')
    }
  }

  return (
    <section
      className="sync-card details-queue"
      aria-labelledby="details-queue-title"
    >
      <h3 id="details-queue-title">Character synchronization</h3>
      <p role="status">
        {state.pendingCount} character updates queued; {state.failedCount} need
        attention.{!state.online && ' Offline.'}
      </p>

      {state.notification && (
        <div role="status">
          <p>
            {state.notification.count}{' '}
            {state.notification.count === 1 ? 'character' : 'characters'} updated.
          </p>
          <button
            className="button button--compact button--quiet"
            type="button"
            onClick={outbox.clearNotification}
          >
            Dismiss character message
          </button>
        </div>
      )}

      {state.pendingCount > 0 && (
        <button
          className="button button--compact"
          type="button"
          onClick={() => void outbox.syncNow()}
        >
          Sync character updates now
        </button>
      )}
      {state.failedCount > 0 && (
        <button
          className="button button--compact"
          type="button"
          onClick={() => perform(outbox.retryAll)}
        >
          Retry failed character updates
        </button>
      )}

      {state.items.length > 0 && (
        <ul>
          {state.items.map((item) => (
            <li key={item.characterId}>
              {item.details.characterName} -{' '}
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
                  Retry {item.details.characterName}
                </button>
              )}
              {item.status !== 'syncing' && (
                <button
                  type="button"
                  className="button button--compact button--danger"
                  onClick={() => perform(() => outbox.discard(item.characterId))}
                >
                  Discard {item.details.characterName} update
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function FigurantList({
  activeView = 'roster',
  creationRequest = null,
  developerContent = null,
  manager,
  mutationsEnabled = false,
  npcPhotoBaseUrl = '',
  onOperationalStatusChange = null,
}) {
  const [state, setState] = useState({ status: 'idle' })
  const [outboxState, setOutboxState] = useState(EMPTY_OUTBOX_STATE)
  const [cardOutboxState, setCardOutboxState] = useState(EMPTY_OUTBOX_STATE)
  const [detailsOutboxState, setDetailsOutboxState] = useState(EMPTY_OUTBOX_STATE)
  const [queueError, setQueueError] = useState(null)
  const [cardQueueError, setCardQueueError] = useState(null)
  const [detailsQueueError, setDetailsQueueError] = useState(null)
  const [dialogState, setDialogState] = useState(null)
  const [creationMessage, setCreationMessage] = useState(null)
  const [deletionMessage, setDeletionMessage] = useState(null)
  const [filters, setFilters] = useState({})
  const [sortKey, setSortKey] = useState('characterName')
  const [sortDirection, setSortDirection] = useState('asc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [browserOnline, setBrowserOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  const requestId = useRef(0)
  const activeController = useRef(null)
  const handledNotification = useRef(null)
  const handledCardNotification = useRef(null)
  const handledDetailsNotification = useRef(null)
  const handledCreationRequest = useRef(null)
  const outbox = mutationsEnabled ? manager.outbox : null
  const cardOutbox = mutationsEnabled ? manager.cardOutbox : null
  const detailsOutbox = mutationsEnabled ? manager.detailsOutbox : null

  useEffect(() => {
    const markOnline = () => setBrowserOnline(true)
    const markOffline = () => setBrowserOnline(false)
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)
    return () => {
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
    }
  }, [])

  useEffect(() => {
    if (
      !creationRequest ||
      handledCreationRequest.current === creationRequest.requestId
    ) {
      return
    }
    handledCreationRequest.current = creationRequest.requestId
    setDialogState({
      mode: 'create',
      generateIccOnOpen: true,
      initialValues: {
        characterName: creationRequest.characterName,
        factionId: creationRequest.factionId,
      },
    })
  }, [creationRequest])

  async function acceptCreatedFigurant(creation) {
    setState((current) => {
      if (!current.result) return current
      return {
        ...current,
        result: applyCreatedFigurant(current.result, creation.figurant),
      }
    })
    setDialogState(null)
    setCreationMessage(
      `${creation.figurant.characterName} was created as character ${creation.characterId}.`,
    )
  }

  async function deleteFigurant(figurant) {
    const deletion = await manager.softDeleteFigurant(figurant.characterId)
    setState((current) => {
      if (!current.result) return current
      return {
        ...current,
        result: applyDeletedFigurant(
          current.result,
          figurant.characterId,
        ),
      }
    })
    setDialogState(null)
    setDeletionMessage(
      deletion.alreadyDeleted
        ? `${figurant.characterName} was already absent from the active roster.`
        : `${figurant.characterName} was archived and removed from the active roster.`,
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
    if (!detailsOutbox) return undefined
    const unsubscribe = detailsOutbox.subscribe(setDetailsOutboxState)
    detailsOutbox.start().catch((error) => {
      console.error(error)
      setDetailsQueueError('The durable character update queue could not be opened.')
    })
    return () => {
      unsubscribe()
      detailsOutbox.stop()
    }
  }, [detailsOutbox])

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

  useEffect(() => {
    const completed = detailsOutboxState.notification
    if (!completed || handledDetailsNotification.current === completed.id) return
    handledDetailsNotification.current = completed.id
    setState((current) =>
      current.status === 'success' || current.status === 'refreshing'
        ? {
            ...current,
            result: applyDetailsOperations(
              current.result,
              completed.operations,
            ),
          }
        : current,
    )
  }, [detailsOutboxState.notification])

  const baseResult =
    state.status === 'success' || state.status === 'refreshing'
      ? state.result
      : null
  const displayedResult = useMemo(() => {
    if (!baseResult) return null
    const completedOperations = outboxState.notification?.operations ?? []
    const completedCardOperations =
      cardOutboxState.notification?.operations ?? []
    const completedDetailsOperations =
      detailsOutboxState.notification?.operations ?? []
    return applyCardOperations(
      applyCardOperations(
        applyAssignmentOperations(
          applyAssignmentOperations(
            applyDetailsOperations(
              applyDetailsOperations(baseResult, completedDetailsOperations),
              detailsOutboxState.items,
            ),
            completedOperations,
          ),
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
    detailsOutboxState.items,
    detailsOutboxState.notification,
    outboxState.items,
    outboxState.notification,
  ])

  async function saveAssignment(figurant, assignedExternalUserId) {
    if (!outbox || queueError) return false
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
      return true
    } catch (error) {
      console.error(error)
      setQueueError(
        'The assignment could not be saved to the durable queue. Please try again.',
      )
      return false
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

  async function saveDetails(figurant, details) {
    if (!detailsOutbox || detailsQueueError) {
      throw new Error('The character update queue is unavailable.')
    }
    try {
      await detailsOutbox.enqueue({
        characterId: figurant.characterId,
        characterName: figurant.characterName,
        details,
        previousDetails: figurantToEditableDetails(figurant),
      })
      setDialogState(null)
    } catch (error) {
      console.error(error)
      setDetailsQueueError('The character update could not be queued.')
      throw error
    }
  }

  function saveRecurring(figurant, recurring) {
    void saveDetails(figurant, {
      ...figurantToEditableDetails(figurant),
      recurring,
    }).catch(() => {})
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
  const pageCount = Math.max(1, Math.ceil(visibleFigurants.length / pageSize))
  const paginatedFigurants = useMemo(
    () => visibleFigurants.slice(page * pageSize, (page + 1) * pageSize),
    [page, pageSize, visibleFigurants],
  )

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  function sortBy(key) {
    setPage(0)
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  function setFilter(key, value) {
    setPage(0)
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function changePageSize(nextPageSize) {
    setPageSize(nextPageSize)
    setPage(0)
  }

  const operationalStatus = useMemo(() => {
    const pendingCount =
      outboxState.pendingCount +
      cardOutboxState.pendingCount +
      detailsOutboxState.pendingCount
    const failedCount =
      outboxState.failedCount +
      cardOutboxState.failedCount +
      detailsOutboxState.failedCount
    const queueFailure = queueError || cardQueueError || detailsQueueError

    if (state.status === 'error' || queueFailure || failedCount > 0) {
      const details = []
      if (state.status === 'error') details.push(state.message)
      if (queueFailure) details.push(queueFailure)
      if (failedCount > 0) details.push(`${failedCount} queued ${failedCount === 1 ? 'change needs' : 'changes need'} attention.`)
      return { level: 'red', summary: 'Attention required', details }
    }

    const queueOnline = [outboxState, cardOutboxState, detailsOutboxState]
      .filter((queue) => queue.initialized)
      .every((queue) => queue.online)
    const usingCache = displayedResult?.cacheInfo?.source === 'cache'
    if (!browserOnline || !queueOnline || usingCache || pendingCount > 0) {
      const details = []
      if (!browserOnline || !queueOnline) details.push('Connection unavailable; changes remain safely queued.')
      if (usingCache) details.push('The roster is showing its last saved snapshot.')
      if (pendingCount > 0) details.push(`${pendingCount} ${pendingCount === 1 ? 'change is' : 'changes are'} waiting to synchronize.`)
      return { level: 'yellow', summary: 'Working offline', details }
    }

    if (state.status === 'success' || state.status === 'refreshing') {
      return { level: 'green', summary: 'All systems operational', details: ['Roster and synchronization queues are ready.'] }
    }

    return { level: 'neutral', summary: 'Loading roster', details: ['Checking the roster and synchronization queues.'] }
  }, [
    browserOnline,
    cardOutboxState,
    cardQueueError,
    detailsOutboxState,
    detailsQueueError,
    displayedResult,
    outboxState,
    queueError,
    state,
  ])

  useEffect(() => {
    onOperationalStatusChange?.(operationalStatus)
  }, [onOperationalStatusChange, operationalStatus])

  return (
    <section
      className={`figurant-list figurant-list--${activeView}`}
      id={`workspace-panel-${activeView === 'developer' ? 'developer' : 'roster'}`}
      role="tabpanel"
      aria-labelledby={`workspace-tab-${activeView === 'developer' ? 'developer' : 'roster'}`}
      hidden={activeView !== 'roster' && activeView !== 'developer'}
    >
      <div className="figurant-list__heading operator-only">
        <div>
          <h2 id="figurant-list-title">Current figurant characters</h2>
        </div>
        <div className="figurant-list__actions">
          <button
            className="button button--primary"
            type="button"
            disabled={!mutationsEnabled}
            onClick={() => setDialogState({ mode: 'create' })}
          >
            Create character
          </button>
          <button
            className="button button--quiet icon-button"
            type="button"
            aria-label="Refresh characters"
            title="Refresh characters"
            onClick={load}
            disabled={state.status === 'loading' || state.status === 'refreshing'}
          >
            <Icon name="refresh" className={state.status === 'loading' || state.status === 'refreshing' ? 'icon--spinning' : ''} />
          </button>
        </div>
      </div>
      <div className="developer-only developer-panel__intro">
        {developerContent}
        <h2>Manager diagnostics</h2>
      </div>
      <p className="scope-note developer-only">
        {mutationsEnabled
          ? 'Creation, character editing, archiving, assignment, and card changes are enabled for the current data source.'
          : 'This roster is read-only. Character changes and archiving are not available.'}
      </p>
      {!mutationsEnabled && (
        <p className="developer-only">
          Assignment and card controls are disabled. Live mutations require an
          explicit development or authorized-deployment opt-in.
        </p>
      )}
      {queueError && (
        <div className="alert alert--error developer-only" role="alert">
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
        <div className="alert alert--error developer-only" role="alert">
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

      {detailsQueueError && (
        <div className="alert alert--error developer-only" role="alert">
          <p>{detailsQueueError}</p>
          <button
            className="button button--compact"
            type="button"
            onClick={() => setDetailsQueueError(null)}
          >
            Dismiss character queue error
          </button>
        </div>
      )}

      {creationMessage && (
        <div className="alert alert--success operator-only" role="status">
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

      {deletionMessage && (
        <div className="alert alert--success operator-only" role="status">
          <p>{deletionMessage}</p>
          <button
            className="button button--compact button--quiet"
            type="button"
            onClick={() => setDeletionMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {mutationsEnabled && (
        <div className="sync-grid developer-only">
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
          <DetailsSynchronizationQueue
            state={detailsOutboxState}
            outbox={detailsOutbox}
            onError={setDetailsQueueError}
          />
        </div>
      )}

      {state.status === 'idle' && <p className="operator-only">Characters have not been requested yet.</p>}
      {state.status === 'loading' && (
        <p className="operator-only" role="status">Loading characters...</p>
      )}
      {state.status === 'refreshing' && (
        <p className="operator-only" role="status">Refreshing characters...</p>
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
            <p className="developer-only" role="status">
              {displayedResult.cacheInfo.reason} Snapshot saved{' '}
              {new Date(displayedResult.cacheInfo.savedAt).toLocaleString()}.
            </p>
          )}
          <p className="result-summary developer-only" role="status">
            Showing {visibleFigurants.length} of {displayedResult.items.length} characters.
            {' '}{displayedResult.duplicateRows} duplicate API rows were removed.
          </p>
          {displayedResult.warnings.map((warning) => (
            <p className="developer-only" key={warning.code}>{warning.message}</p>
          ))}

          {displayedResult.items.length === 0 ? (
            <p className="operator-only">No active figurant characters were returned.</p>
          ) : (
            <div className="operator-only">
              <PaginationControls
                page={page}
                pageCount={pageCount}
                pageSize={pageSize}
                placement="above roster"
                totalItems={visibleFigurants.length}
                onPageChange={setPage}
                onPageSizeChange={changePageSize}
              />
              <div className="table-scroll">
                <table className="figurant-table">
                  <thead>
                    <tr>
                      {figurantColumns.map((column) => (
                        <th key={column.key} scope="col">
                          {column.sortable === false ? (
                            column.label
                          ) : (
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
                          )}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {figurantColumns.map((column) => (
                        <th key={column.key} scope="col">
                          {column.filterable === false ? null : (
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
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFigurants.map((figurant) => {
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
                              ) : column.key === 'recurring' ? (
                                <RecurringControl
                                  figurant={figurant}
                                  enabled={
                                    mutationsEnabled &&
                                    Boolean(detailsOutbox) &&
                                    !detailsQueueError
                                  }
                                  pending={detailsOutboxState.items.some(
                                    (item) => item.characterId === figurant.characterId,
                                  )}
                                  onChange={saveRecurring}
                                />
                              ) : column.key === 'photo' ? (
                                <FigurantPhoto
                                  figurant={figurant}
                                  photoBaseUrl={npcPhotoBaseUrl}
                                />
                              ) : column.key === 'actions' ? (
                                <button
                                  className="button button--compact icon-button"
                                  type="button"
                                  aria-label={`Edit ${figurant.characterName} (${figurant.characterId})`}
                                  title="Edit character"
                                  disabled={
                                    !mutationsEnabled ||
                                    !detailsOutbox ||
                                    Boolean(detailsQueueError)
                                  }
                                  onClick={() =>
                                    setDialogState({ mode: 'edit', figurant })
                                  }
                                >
                                  <Icon name="edit" size={16} />
                                </button>
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
              <PaginationControls
                page={page}
                pageCount={pageCount}
                pageSize={pageSize}
                placement="below roster"
                totalItems={visibleFigurants.length}
                onPageChange={setPage}
                onPageSizeChange={changePageSize}
              />
            </div>
          )}

          {displayedResult.items.length > 0 && visibleFigurants.length === 0 && (
            <p className="operator-only">No characters match the active filters.</p>
          )}
        </>
      )}

      <FigurantDetailsDialog
        open={Boolean(dialogState)}
        manager={manager}
        figurant={dialogState?.mode === 'edit' ? dialogState.figurant : null}
        initialValues={dialogState?.initialValues ?? null}
        generateIccOnOpen={Boolean(dialogState?.generateIccOnOpen)}
        onClose={() => setDialogState(null)}
        onCreated={acceptCreatedFigurant}
        onUpdated={saveDetails}
        onDeleted={deleteFigurant}
        deletionBlockedReason={
          dialogState?.mode === 'edit' &&
          [
            ...outboxState.items,
            ...cardOutboxState.items,
            ...detailsOutboxState.items,
          ].some(
            (item) =>
              item.characterId === dialogState.figurant.characterId,
          )
            ? 'Resolve or discard this character’s queued changes before archiving it.'
            : null
        }
      />
    </section>
  )
}
