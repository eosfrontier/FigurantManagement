import { useEffect, useRef, useState } from 'react'
import { getUserFacingError } from '../../api/errors.js'

export default function ResourcePanel({
  title,
  description,
  load,
  loadAllVersion,
  renderSummary,
  renderData,
}) {
  const [state, setState] = useState({ status: 'idle' })
  const [showJson, setShowJson] = useState(false)
  const requestId = useRef(0)
  const activeController = useRef(null)

  async function run() {
    activeController.current?.abort()
    const currentRequest = ++requestId.current
    const controller = new AbortController()
    activeController.current = controller
    setState({ status: 'loading' })

    try {
      const data = await load({ signal: controller.signal })
      if (requestId.current === currentRequest) {
        setState({ status: 'success', data })
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
    if (loadAllVersion > 0) run()
  }, [loadAllVersion]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      requestId.current += 1
      activeController.current?.abort()
    }
  }, [])

  const busy = state.status === 'loading'

  return (
    <section className="resource-panel" aria-busy={busy}>
      <div className="resource-panel__heading">
        <div>
          <p className="resource-panel__eyebrow">Read-only resource</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button type="button" onClick={run} disabled={busy}>
          {busy ? 'Loading…' : state.status === 'idle' ? 'Load' : 'Refresh'}
        </button>
      </div>

      {state.status === 'idle' && (
        <p className="resource-panel__empty">Not requested yet.</p>
      )}
      {busy && <p className="resource-panel__empty">Requesting data…</p>}
      {state.status === 'error' && (
        <div className="resource-panel__error" role="alert">
          <p>{state.message}</p>
          <button type="button" className="button--quiet" onClick={run}>
            Try again
          </button>
        </div>
      )}
      {state.status === 'success' && (
        <div className="resource-panel__result">
          <div className="resource-panel__summary">
            {renderSummary(state.data)}
          </div>
          {renderData && (
            <div className="resource-panel__data">{renderData(state.data)}</div>
          )}
          <details
            className="resource-panel__json"
            onToggle={(event) => setShowJson(event.currentTarget.open)}
          >
            <summary>View normalized JSON</summary>
            {showJson && <pre>{JSON.stringify(state.data, null, 2)}</pre>}
          </details>
        </div>
      )}
    </section>
  )
}
