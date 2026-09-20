import { useMemo } from 'react'
import { useJoomlaSession } from './auth/JoomlaSessionContext.jsx'
import { createFigurantManager } from './data/figurantManager.js'
import ApiWorkbench from './features/api-workbench/ApiWorkbench.jsx'
import FigurantList from './features/figurant-list/FigurantList.jsx'
import NameGenerator from './features/name-generator/NameGenerator.jsx'
import {
  createIndexedDbManagerStorage,
  createMemoryManagerStorage,
} from './offline/managerStorage.js'

function ManagerArea({ dataSource, figurantManager, loginUrl, mutationsEnabled }) {
  const {
    status,
    session,
    authMode,
    canManageFigurants,
    isLoggedIn,
    message,
    refresh,
  } = useJoomlaSession()

  return (
    <section className="manager-area" aria-labelledby="manager-area-title">
      <div className="section-heading manager-area__heading">
        <div>
          <p className="eyebrow">Event workspace</p>
          <h2 id="manager-area-title">Figurant management</h2>
          <p className="section-intro">
            Assign crew and activate reusable RFID cards without holding up the
            next character.
          </p>
        </div>
        <span className="session-badge">Session: {authMode}</span>
      </div>

      {(status === 'idle' || status === 'loading') && (
        <p role="status">Checking the Joomla session…</p>
      )}

      {status === 'error' && (
        <div className="alert alert--error" role="alert">
          <p>{message}</p>
          <button className="button button--compact" type="button" onClick={refresh}>
            Retry session check
          </button>
        </div>
      )}

      {status === 'ready' && !isLoggedIn && (
        <div>
          <p>You are not logged in. The character manager is hidden.</p>
          {authMode === 'joomla' && <a href={loginUrl}>Open Joomla login</a>}
          <button className="button button--compact" type="button" onClick={refresh}>
            Check session again
          </button>
        </div>
      )}

      {status === 'ready' && isLoggedIn && !canManageFigurants && (
        <div>
          <p>
            Joomla user {session.externalUserId} is logged in but is not in a
            configured figurant-manager group.
          </p>
          <button className="button button--compact" type="button" onClick={refresh}>
            Refresh session
          </button>
        </div>
      )}

      {status === 'ready' && canManageFigurants && (
        <>
          <div className="session-summary">
            <p>
              Signed in as <strong>{session.externalUserId}</strong>
              <span aria-hidden="true"> · </span>
              <span className="session-summary__groups">
                Groups {session.groupIds.join(', ')}
              </span>
            </p>
            <button
              type="button"
              className="button button--quiet"
              onClick={refresh}
            >
              Refresh session
            </button>
          </div>
          <FigurantList
            manager={figurantManager}
            mutationsEnabled={mutationsEnabled}
          />
          <details className="diagnostics-panel">
            <summary>API diagnostics</summary>
            <ApiWorkbench dataSource={dataSource} mode={dataSource.mode} />
          </details>
        </>
      )}
    </section>
  )
}

export default function App({ dataSource, config }) {
  const { status: sessionStatus, canManageFigurants } = useJoomlaSession()
  const figurantManager = useMemo(() => {
    const storage =
      config.mode === 'live'
        ? createIndexedDbManagerStorage({
            scope: `${config.mode}-${config.groupName}`,
          })
        : createMemoryManagerStorage()

    return createFigurantManager({ dataSource, storage })
  }, [config.groupName, config.mode, dataSource])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <img
            className="app-header__logo"
            src="/favicon.svg"
            alt=""
            aria-hidden="true"
          />
          <div>
            <p className="app-header__organization">EOS Frontier</p>
            <h1>Figurant Manager</h1>
          </div>
        </div>
        <span className={`mode-badge mode-badge--${config.mode}`}>
          {config.mode === 'mock' ? 'Mock data' : 'Live data'}
        </span>
      </header>
      <main className="app-main">
        <ManagerArea
          dataSource={dataSource}
          figurantManager={figurantManager}
          loginUrl={config.session.loginUrl}
          mutationsEnabled={config.mutationsEnabled}
        />
        {sessionStatus === 'ready' && canManageFigurants ? (
          <details className="utility-panel">
            <summary>
              <span>Faction name generator</span>
              <small>Preparation utility</small>
            </summary>
            <NameGenerator />
          </details>
        ) : (
          <NameGenerator />
        )}
      </main>
    </div>
  )
}
