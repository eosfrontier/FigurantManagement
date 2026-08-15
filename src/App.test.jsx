import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { JoomlaSessionProvider } from './auth/JoomlaSessionContext.jsx'
import { mockApplicationData } from './fixtures/mockData.js'
import App from './App.jsx'

function renderApp(session) {
  const dataSource = {
    mode: 'mock',
    getSession: vi.fn().mockResolvedValue(session),
    getFigurants: vi.fn().mockResolvedValue(mockApplicationData.figurants),
    getHealth: vi.fn(),
    getCurrentEvent: vi.fn(),
    getAssignableUsers: vi.fn(),
  }
  const config = {
    mode: 'mock',
    session: { mode: 'mock', loginUrl: '/' },
  }

  render(
    <JoomlaSessionProvider loadSession={dataSource.getSession} authMode="mock">
      <App dataSource={dataSource} config={config} />
    </JoomlaSessionProvider>,
  )
  return dataSource
}

describe('App session visibility', () => {
  it('loads the manager list only for a manager session', async () => {
    const dataSource = renderApp({
      externalUserId: '7',
      groupIds: ['30'],
      authenticated: true,
      canManageFigurants: true,
      role: 'manager',
    })

    expect(await screen.findByText(/Showing 4 of 4 characters/)).toBeInTheDocument()
    expect(dataSource.getFigurants).toHaveBeenCalledTimes(1)
  })

  it('keeps manager data unloaded for a guest', async () => {
    const dataSource = renderApp({
      externalUserId: '0',
      groupIds: [],
      authenticated: false,
      canManageFigurants: false,
      role: 'guest',
    })

    expect(await screen.findByText(/character manager is hidden/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Faction name generator' })).toBeInTheDocument()
    expect(dataSource.getFigurants).not.toHaveBeenCalled()
  })
})
