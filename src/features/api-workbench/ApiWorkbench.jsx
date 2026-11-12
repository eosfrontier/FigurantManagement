import { useState } from 'react'
import ResourcePanel from './ResourcePanel.jsx'

function StatusSummary({ healthy }) {
  return (
    <p className={`status-line ${healthy ? 'status-line--good' : ''}`}>
      <span aria-hidden="true" />
      {healthy ? 'Orthanc reports healthy' : 'Orthanc reports unhealthy'}
    </p>
  )
}

function EventSummary({ event }) {
  if (!event) return <p>No current event was returned.</p>
  return (
    <div>
      <strong>{event.title}</strong>
      <p>
        {event.startDate} — {event.endDate}
      </p>
    </div>
  )
}

function UsersTable({ users }) {
  if (users.length === 0) return <p>No assignable users were returned.</p>
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>External ID</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user, index) => (
          <tr key={`${user.externalUserId}-${user.displayName}-${index}`}>
            <td>{user.displayName}</td>
            <td>{user.externalUserId}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function FigurantsTable({ result }) {
  if (result.items.length === 0) return <p>No active figurants were returned.</p>
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Character</th>
            <th>Faction</th>
            <th>NPC</th>
            <th>Card</th>
          </tr>
        </thead>
        <tbody>
          {result.items.map((figurant) => (
            <tr key={figurant.characterId}>
              <td>
                {figurant.characterName}
                {figurant.recurring && <small>Recurring</small>}
              </td>
              <td>{figurant.factionId}</td>
              <td>{figurant.assignedDisplayName ?? 'Unassigned'}</td>
              <td>{figurant.cardId ?? 'Not scanned'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ApiWorkbench({ dataSource, mode }) {
  const [loadAllVersion, setLoadAllVersion] = useState(0)

  return (
    <section aria-labelledby="api-workbench-title">
      <header className="hero">
        <div>
          <p className="hero__kicker">Figurant Manager</p>
          <h2 id="api-workbench-title">Orthanc API workbench</h2>
        </div>
        <div className="hero__actions">
          <span className={`mode-badge mode-badge--${mode}`}>
            {mode === 'mock' ? 'Mock data' : 'Live Orthanc'}
          </span>
          <button type="button" onClick={() => setLoadAllVersion((value) => value + 1)}>
            Load all resources
          </button>
        </div>
      </header>

      <div className="workbench-grid">
        <ResourcePanel
          title="Health"
          description="Checks whether the Orthanc service is responding."
          load={dataSource.getHealth}
          loadAllVersion={loadAllVersion}
          renderSummary={(health) => <StatusSummary {...health} />}
        />
        <ResourcePanel
          title="Current event"
          description="Retrieves the event currently active in Orthanc."
          load={dataSource.getCurrentEvent}
          loadAllVersion={loadAllVersion}
          renderSummary={(event) => <EventSummary event={event} />}
        />
        <ResourcePanel
          title="Assignable NPCs"
          description="Lists members of the configured figurant group for the current event."
          load={dataSource.getAssignableUsers}
          loadAllVersion={loadAllVersion}
          renderSummary={(users) => <strong>{users.length} available NPCs</strong>}
          renderData={(users) => <UsersTable users={users} />}
        />
        <ResourcePanel
          title="Active characters"
          description="Retrieves, deduplicates and normalizes characters available for assignment."
          load={dataSource.getFigurants}
          loadAllVersion={loadAllVersion}
          renderSummary={(result) => (
            <div className="metric-row">
              <span><strong>{result.items.length}</strong> characters</span>
              <span><strong>{result.duplicateRows}</strong> duplicate rows removed</span>
            </div>
          )}
          renderData={(result) => <FigurantsTable result={result} />}
        />
      </div>
    </section>
  )
}
