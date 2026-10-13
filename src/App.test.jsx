import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JoomlaSessionProvider } from './auth/JoomlaSessionContext.jsx'
import { mockApplicationData } from './fixtures/mockData.js'
import App from './App.jsx'

function renderApp(session, { mutationsEnabled = false, dataSourceOverrides = {} } = {}) {
  const dataSource = {
    mode: 'mock',
    getSession: vi.fn().mockResolvedValue(session),
    getFigurants: vi.fn().mockResolvedValue(mockApplicationData.figurants),
    getHealth: vi.fn(),
    getCurrentEvent: vi.fn(),
    getAssignableUsers: vi.fn(),
    ...dataSourceOverrides,
  }
  const config = {
    mode: 'mock',
    mutationsEnabled,
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
    const user = userEvent.setup()
    const dataSource = renderApp({
      externalUserId: '7',
      groupIds: ['30'],
      authenticated: true,
      canManageFigurants: true,
      role: 'manager',
    })

    await screen.findByRole('tab', { name: 'Active roster' })
    const generatorTab = screen.getByRole('tab', { name: 'Faction name generator' })
    expect(generatorTab).toHaveAttribute('aria-selected', 'true')
    expect(dataSource.getFigurants).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('tab', { name: 'Active roster' }))
    expect(screen.getByRole('heading', { name: 'Current figurant characters' })).toBeVisible()

    await user.click(screen.getByRole('tab', { name: 'Developer' }))
    expect(screen.getByText('Mock data')).toBeVisible()
    expect(screen.getByText(/Showing 4 of 4 characters/)).toBeVisible()
  })

  it('keeps manager data unloaded for a guest', async () => {
    const dataSource = renderApp({
      externalUserId: '0',
      groupIds: [],
      authenticated: false,
      canManageFigurants: false,
      role: 'guest',
    })

    expect(await screen.findByRole('button', { name: /System status: Name generator ready/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Faction name suggestions' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'Faction name generator' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('tab', { name: 'Active roster' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Create character from/i }),
    ).not.toBeInTheDocument()
    expect(dataSource.getFigurants).not.toHaveBeenCalled()
  })

  it('opens character creation from an edited generated name', async () => {
    const user = userEvent.setup()
    const dataSource = renderApp(
      {
        externalUserId: '7',
        groupIds: ['30'],
        authenticated: true,
        canManageFigurants: true,
        role: 'manager',
      },
      {
        mutationsEnabled: true,
        dataSourceOverrides: {
          isIccNumberAvailable: vi.fn().mockResolvedValue(true),
        },
      },
    )

    await screen.findByRole('tab', { name: 'Active roster' })
    const nameInput = await screen.findByLabelText('aquila name 1')
    fireEvent.change(nameInput, { target: { value: 'Solace Prym' } })
    await user.click(
      screen.getByRole('button', {
        name: 'Create character from Solace Prym',
      }),
    )

    expect(screen.getByRole('tab', { name: 'Active roster' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const dialog = await screen.findByRole('dialog', {
      name: 'Create a new character',
    })
    expect(within(dialog).getByLabelText('Character name')).toHaveValue(
      'Solace Prym',
    )
    expect(within(dialog).getByLabelText('Faction')).toHaveValue('aquila')
    await waitFor(() =>
      expect(within(dialog).getByLabelText('ICC number')).not.toHaveValue(''),
    )
    expect(dataSource.isIccNumberAvailable).toHaveBeenCalledTimes(1)
  })
})
