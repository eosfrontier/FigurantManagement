import { useEffect, useMemo, useRef, useState } from 'react'
import { getUserFacingError } from '../../api/errors.js'
import {
  figurantColumns,
  formatFigurantCell,
  getVisibleFigurants,
} from './figurantTable.js'

function AssignmentControl({
  figurant,
  users,
  enabled,
  busy,
  pending,
  onSave,
}) {
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
          disabled={!enabled || busy}
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
        disabled={!enabled || busy || selectedValue === currentValue}
        onClick={() =>
          onSave(figurant, selectedValue === '' ? null : selectedValue)
        }
      >
        {pending ? 'Saving assignment…' : `Save assignment for ${label}`}
      </button>
    </div>
  )
}

export default function FigurantList({
  loadFigurants,
  setFigurantAssignment,
  mutationsEnabled = false,
}) {
  const [state, setState] = useState({ status: 'idle' })
  const [assignmentState, setAssignmentState] = useState({ status: 'idle' })
  const [filters, setFilters] = useState({})
  const [sortKey, setSortKey] = useState('characterName')
  const [sortDirection, setSortDirection] = useState('asc')
  const requestId = useRef(0)
  const activeController = useRef(null)
  const mutationRequestId = useRef(0)
  const mutationController = useRef(null)

  async function load() {
    activeController.current?.abort()
    const controller = new AbortController()
    const currentRequest = ++requestId.current
    activeController.current = controller
    setState({ status: 'loading' })

    try {
      const result = await loadFigurants({ signal: controller.signal })
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
      mutationRequestId.current += 1
      mutationController.current?.abort()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveAssignment(figurant, assignedExternalUserId) {
    if (
      !mutationsEnabled ||
      typeof setFigurantAssignment !== 'function' ||
      assignmentState.status === 'pending'
    ) {
      return
    }

    const controller = new AbortController()
    const currentRequest = ++mutationRequestId.current
    mutationController.current = controller
    const request = {
      characterId: figurant.characterId,
      characterName: figurant.characterName,
      assignedExternalUserId,
    }
    setAssignmentState({ status: 'pending', request })

    try {
      const result = await setFigurantAssignment(
        {
          characterId: request.characterId,
          assignedExternalUserId,
        },
        { signal: controller.signal },
      )
      if (mutationRequestId.current !== currentRequest) return

      setAssignmentState({
        status: 'success',
        request,
        message:
          result.affectedRows === 0
            ? `The assignment for ${request.characterName} was already up to date. Refreshing characters…`
            : `The assignment for ${request.characterName} was saved. Refreshing characters…`,
      })
      await load()
      if (mutationRequestId.current === currentRequest) {
        setAssignmentState((current) => ({
          ...current,
          message:
            result.affectedRows === 0
              ? `The assignment for ${request.characterName} was already up to date.`
              : `The assignment for ${request.characterName} was saved.`,
        }))
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      console.error(error)
      if (mutationRequestId.current === currentRequest) {
        setAssignmentState({
          status: 'error',
          request,
          message: `Assignment failed. ${getUserFacingError(error, {
            fallback: 'Something unexpected went wrong.',
          })}`,
        })
      }
    } finally {
      if (mutationRequestId.current === currentRequest) {
        mutationController.current = null
      }
    }
  }

  const visibleFigurants = useMemo(
    () =>
      state.status === 'success'
        ? getVisibleFigurants(
            state.result.items,
            filters,
            sortKey,
            sortDirection,
          )
        : [],
    [filters, sortDirection, sortKey, state],
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
        disabled={
          state.status === 'loading' || assignmentState.status === 'pending'
        }
      >
        {state.status === 'loading' ? 'Loading…' : 'Refresh characters'}
      </button>

      {assignmentState.status === 'pending' && (
        <p role="status">
          Saving the assignment for {assignmentState.request.characterName}…
        </p>
      )}
      {assignmentState.status === 'success' && (
        <p role="status">{assignmentState.message}</p>
      )}
      {assignmentState.status === 'error' && (
        <div role="alert">
          <p>{assignmentState.message}</p>
          <button
            type="button"
            onClick={() =>
              saveAssignment(
                {
                  characterId: assignmentState.request.characterId,
                  characterName: assignmentState.request.characterName,
                },
                assignmentState.request.assignedExternalUserId,
              )
            }
          >
            Retry assignment
          </button>
        </div>
      )}

      {state.status === 'idle' && <p>Characters have not been requested yet.</p>}
      {state.status === 'loading' && (
        <p role="status">Loading characters from the selected data source…</p>
      )}
      {state.status === 'error' && (
        <div role="alert">
          <p>{state.message}</p>
          <button type="button" onClick={load}>Try again</button>
        </div>
      )}

      {state.status === 'success' && (
        <>
          <p role="status">
            Showing {visibleFigurants.length} of {state.result.items.length} characters.
            {' '}{state.result.duplicateRows} duplicate API rows were removed.
          </p>
          {state.result.warnings.map((warning) => (
            <p key={warning.code}>{warning.message}</p>
          ))}

          {state.result.items.length === 0 ? (
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
                {visibleFigurants.map((figurant) => (
                  <tr key={figurant.characterId}>
                    {figurantColumns.map((column) => (
                      <td key={column.key}>
                        {column.key === 'assignedDisplayName' ? (
                          <AssignmentControl
                            figurant={figurant}
                            users={state.result.assignableUsers ?? []}
                            enabled={mutationsEnabled}
                            busy={assignmentState.status === 'pending'}
                            pending={
                              assignmentState.status === 'pending' &&
                              assignmentState.request.characterId ===
                                figurant.characterId
                            }
                            onSave={saveAssignment}
                          />
                        ) : (
                          formatFigurantCell(figurant, column.key)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {state.result.items.length > 0 && visibleFigurants.length === 0 && (
            <p>No characters match the active filters.</p>
          )}
        </>
      )}
    </section>
  )
}
