import { useJoomlaSession } from './auth/JoomlaSessionContext.jsx'
import ApiWorkbench from './features/api-workbench/ApiWorkbench.jsx'
import FigurantList from './features/figurant-list/FigurantList.jsx'
import NameGenerator from './features/name-generator/NameGenerator.jsx'

function ManagerArea({ dataSource, loginUrl, mutationsEnabled }) {
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
      <h2 id="manager-area-title">Figurant management</h2>
      <p>Session mode: {authMode}</p>

      {(status === 'idle' || status === 'loading') && (
        <p role="status">Checking the Joomla session…</p>
      )}

      {status === 'error' && (
        <div role="alert">
          <p>{message}</p>
          <button type="button" onClick={refresh}>Retry session check</button>
        </div>
      )}

      {status === 'ready' && !isLoggedIn && (
        <div>
          <p>You are not logged in. The character manager is hidden.</p>
          {authMode === 'joomla' && <a href={loginUrl}>Open Joomla login</a>}
          <button type="button" onClick={refresh}>Check session again</button>
        </div>
      )}

      {status === 'ready' && isLoggedIn && !canManageFigurants && (
        <div>
          <p>
            Joomla user {session.externalUserId} is logged in but is not in a
            configured figurant-manager group.
          </p>
          <button type="button" onClick={refresh}>Refresh session</button>
        </div>
      )}

      {status === 'ready' && canManageFigurants && (
        <>
          <p>
            Joomla user {session.externalUserId}; groups: {session.groupIds.join(', ')}.
          </p>
          <button type="button" onClick={refresh}>Refresh session</button>
          <FigurantList
            loadFigurants={dataSource.getFigurants}
            setFigurantAssignment={dataSource.setFigurantAssignment}
            mutationsEnabled={mutationsEnabled}
          />
          <details>
            <summary>API diagnostics</summary>
            <ApiWorkbench dataSource={dataSource} mode={dataSource.mode} />
          </details>
        </>
      )}
    </section>
  )
}

export default function App({ dataSource, config }) {
  return (
    <>
      <header>
        <h1>Figurant Manager</h1>
        <p>Data source: {config.mode}</p>
      </header>
      <main>
        <NameGenerator />
        <ManagerArea
          dataSource={dataSource}
          loginUrl={config.session.loginUrl}
          mutationsEnabled={config.mutationsEnabled}
        />
      </main>
    </>
  )
}
