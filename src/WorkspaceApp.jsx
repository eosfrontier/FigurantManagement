import { useCallback, useEffect, useMemo, useState } from 'react'
import { useJoomlaSession } from './auth/JoomlaSessionContext.jsx'
import { createFigurantManager } from './data/figurantManager.js'
import ApiWorkbench from './features/api-workbench/ApiWorkbench.jsx'
import FigurantList from './features/figurant-list/FigurantList.jsx'
import NameGenerator from './features/name-generator/NameGenerator.jsx'
import {
  createIndexedDbManagerStorage,
  createMemoryManagerStorage,
} from './offline/managerStorage.js'

const INITIAL_STATUS = {
  level: 'neutral',
  summary: 'Checking services',
  details: ['The manager is starting.'],
}

function SystemStatus({ status }) {
  const details = status.details?.length ? status.details : [status.summary]
  return (
    <div className={`system-status system-status--${status.level}`}>
      <button className="system-status__button" type="button" aria-label={`System status: ${status.summary}`} aria-describedby="system-status-tooltip">
        <svg viewBox="0 0 32 24" width="34" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 20h14a6 6 0 0 0 .6-12A8.5 8.5 0 0 0 7.4 6.7 6.7 6.7 0 0 0 9 20Z" />
          {status.level === 'green' && <path d="m11.5 13 2.3 2.2 4.8-5" />}
          {(status.level === 'yellow' || status.level === 'red') && <><path d="M16 10v5" /><path d="M16 18h.01" /></>}
          {status.level === 'neutral' && <path d="M12 14h8" />}
        </svg>
      </button>
      <div className="system-status__tooltip" id="system-status-tooltip" role="tooltip">
        <strong>{status.summary}</strong>
        {details.map((detail) => <span key={detail}>{detail}</span>)}
      </div>
    </div>
  )
}

function ManagerTabs({ activeTab, onChange }) {
  const tabs = [
    ['generator', 'Faction name generator'],
    ['roster', 'Active roster'],
    ['developer', 'Developer'],
  ]

  function handleKeyDown(event, index) {
    let nextIndex = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    const nextTab = tabs[nextIndex][0]
    onChange(nextTab)
    document.getElementById(`workspace-tab-${nextTab}`)?.focus()
  }

  return (
    <div className="workspace-tabs" role="tablist" aria-label="Figurant Manager sections">
      {tabs.map(([id, label], index) => (
        <button id={`workspace-tab-${id}`} className="workspace-tabs__tab" type="button" role="tab" aria-selected={activeTab === id} aria-controls={`workspace-panel-${id}`} tabIndex={activeTab === id ? 0 : -1} key={id} onClick={() => onChange(id)} onKeyDown={(event) => handleKeyDown(event, index)}>
          {label}
        </button>
      ))}
    </div>
  )
}

function ManagerArea({ dataSource, figurantManager, loginUrl, mode, mutationsEnabled, onStatusChange }) {
  const [activeTab, setActiveTab] = useState('generator')
  const { status, session, authMode, canManageFigurants, isLoggedIn, message, refresh } = useJoomlaSession()

  useEffect(() => {
    if (status === 'error') {
      onStatusChange({ level: 'red', summary: 'Session check failed', details: [message] })
    } else if (status === 'idle' || status === 'loading') {
      onStatusChange(INITIAL_STATUS)
    } else if (!canManageFigurants) {
      onStatusChange({ level: 'green', summary: 'Name generator ready', details: ['Manager tools require an authorized Joomla session.'] })
    }
  }, [canManageFigurants, message, onStatusChange, status])

  if (status !== 'ready' || !canManageFigurants) {
    return (
      <section className="manager-area" aria-label="Figurant utilities">
        <div className="workspace-tabs" role="tablist" aria-label="Figurant Manager sections">
          <button id="workspace-tab-generator" className="workspace-tabs__tab" type="button" role="tab" aria-selected="true" aria-controls="workspace-panel-generator">Faction name generator</button>
        </div>
        {status === 'error' && <div className="auth-notice alert alert--error" role="alert"><p>{message}</p><button className="button button--compact" type="button" onClick={refresh}>Retry session check</button></div>}
        {status === 'ready' && !isLoggedIn && authMode === 'joomla' && <div className="auth-notice"><a href={loginUrl}>Sign in to open manager tools</a><button className="button button--compact button--quiet" type="button" onClick={refresh}>Check session again</button></div>}
        {status === 'ready' && isLoggedIn && !canManageFigurants && <div className="auth-notice"><span>This account does not have access to manager tools.</span><button className="button button--compact button--quiet" type="button" onClick={refresh}>Refresh session</button></div>}
        <section id="workspace-panel-generator" role="tabpanel" aria-labelledby="workspace-tab-generator"><NameGenerator /></section>
      </section>
    )
  }

  const developerContent = (
    <>
      <div className="developer-overview">
        <div><p className="eyebrow">Joomla session</p><p>Signed in as <strong>{session.externalUserId}</strong><span aria-hidden="true"> · </span>Groups {session.groupIds.join(', ')}</p><button className="button button--compact button--quiet" type="button" onClick={refresh}>Refresh session</button></div>
      </div>
      <div className="diagnostics-panel"><ApiWorkbench dataSource={dataSource} mode={mode} /></div>
    </>
  )

  return (
    <section className="manager-area" aria-label="Figurant management">
      <ManagerTabs activeTab={activeTab} onChange={setActiveTab} />
      <section id="workspace-panel-generator" role="tabpanel" aria-labelledby="workspace-tab-generator" hidden={activeTab !== 'generator'}><NameGenerator /></section>
      <FigurantList activeView={activeTab} developerContent={developerContent} manager={figurantManager} mutationsEnabled={mutationsEnabled} onOperationalStatusChange={onStatusChange} />
    </section>
  )
}

export default function WorkspaceApp({ dataSource, config }) {
  const [operationalStatus, setOperationalStatus] = useState(INITIAL_STATUS)
  const handleOperationalStatusChange = useCallback((nextStatus) => {
    setOperationalStatus((currentStatus) =>
      currentStatus.level === nextStatus.level &&
      currentStatus.summary === nextStatus.summary &&
      JSON.stringify(currentStatus.details) === JSON.stringify(nextStatus.details)
        ? currentStatus
        : nextStatus,
    )
  }, [])
  const figurantManager = useMemo(() => {
    const storage = config.mode === 'live' ? createIndexedDbManagerStorage({ scope: `${config.mode}-${config.groupName}` }) : createMemoryManagerStorage()
    return createFigurantManager({ dataSource, storage })
  }, [config.groupName, config.mode, dataSource])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand"><img className="app-header__logo" src="/favicon.svg" alt="" aria-hidden="true" /><div><p className="app-header__organization">EOS Frontier</p><h1>Figurant Manager</h1></div></div>
        <SystemStatus status={operationalStatus} />
      </header>
      <main className="app-main"><ManagerArea dataSource={dataSource} figurantManager={figurantManager} loginUrl={config.session.loginUrl} mode={config.mode} mutationsEnabled={config.mutationsEnabled} onStatusChange={handleOperationalStatusChange} /></main>
    </div>
  )
}
