import { useEffect, useMemo, useRef, useState } from 'react'
import { getUserFacingError } from '../../api/errors.js'
import {
  figurantColumns,
  formatFigurantCell,
  getVisibleFigurants,
} from './figurantTable.js'

export default function FigurantList({ loadFigurants }) {
  const [state, setState] = useState({ status: 'idle' })
  const [filters, setFilters] = useState({})
  const [sortKey, setSortKey] = useState('characterName')
  const [sortDirection, setSortDirection] = useState('asc')
  const requestId = useRef(0)
  const activeController = useRef(null)

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
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      <p>This view is read-only. Assignment, cards, editing and deletion are not enabled.</p>
      <button type="button" onClick={load} disabled={state.status === 'loading'}>
        {state.status === 'loading' ? 'Loading…' : 'Refresh characters'}
      </button>

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
                        {formatFigurantCell(figurant, column.key)}
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
