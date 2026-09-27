import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/errors.js'
import { createFigurantManager } from '../../data/figurantManager.js'
import { createMockDataSource } from '../../data/mockDataSource.js'
import { mockApplicationData } from '../../fixtures/mockData.js'
import { createMemoryManagerStorage } from '../../offline/managerStorage.js'
import FigurantList from './FigurantList.jsx'

function createTestManager({
  isOnline,
  sendAssignment,
  sendCardChange = vi.fn(),
}) {
  const figurants = structuredClone(mockApplicationData.figurants)
  figurants.assignableUsers = structuredClone(mockApplicationData.users)
  const dataSource = {
    getFigurants: vi.fn().mockResolvedValue(figurants),
    setFigurantAssignment: sendAssignment,
    setFigurantCard: sendCardChange,
  }
  const storage = createMemoryManagerStorage()
  const manager = createFigurantManager({
    dataSource,
    storage,
    outboxOptions: {
      isOnline,
      addOnlineListener: () => () => {},
    },
  })
  return { dataSource, manager, storage }
}

describe('FigurantList', () => {
  it('creates an unassigned character and keeps age and birth date in sync', async () => {
    const user = userEvent.setup()
    const dataSource = createMockDataSource({ delayMs: 0 })
    const manager = createFigurantManager({
      dataSource,
      storage: createMemoryManagerStorage(),
    })

    render(<FigurantList manager={manager} mutationsEnabled />)

    await user.click(await screen.findByRole('button', { name: 'Create character' }))
    const dialog = screen.getByRole('dialog', {
      name: 'Create a new character',
    })
    expect(dialog).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText('Character name'), 'Mara Venn')
    await user.type(within(dialog).getByLabelText('ICC number'), '7002 10000 0000')
    await user.type(within(dialog).getByLabelText('Age'), '25')
    expect(within(dialog).getByLabelText('Birth date')).toHaveValue('27-12-215NT')
    await user.clear(within(dialog).getByLabelText('Birth date'))
    await user.type(within(dialog).getByLabelText('Birth date'), '28-12-220NT')
    expect(within(dialog).getByLabelText('Age')).toHaveValue(19)
    await user.click(
      within(dialog).getByRole('button', { name: 'Create character' }),
    )

    expect(
      await screen.findByText(/Mara Venn was created as character/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Mara Venn')).toBeInTheDocument()
  })

  it('queues multiple optimistic assignments without blocking the operator', async () => {
    const user = userEvent.setup()
    const sendAssignment = vi.fn()
    const { manager, storage } = createTestManager({
      isOnline: () => false,
      sendAssignment,
    })

    render(<FigurantList manager={manager} mutationsEnabled />)

    const calyx = await screen.findByLabelText('Assignment for Calyx Mora (1008)')
    await user.selectOptions(calyx, '81')
    await user.click(
      screen.getByRole('button', {
        name: 'Queue assignment for Calyx Mora (1008)',
      }),
    )

    const ilya = screen.getByLabelText('Assignment for Ilya Venn (1021)')
    await user.selectOptions(ilya, '')
    await user.click(
      screen.getByRole('button', {
        name: 'Queue assignment for Ilya Venn (1021)',
      }),
    )

    expect(await screen.findByText(/2 assignment changes waiting/)).toBeInTheDocument()
    expect(calyx).toHaveValue('81')
    expect(ilya).toHaveValue('')
    expect(screen.getByLabelText('Assignment for Nara Holt (1094)')).toBeEnabled()
    expect(sendAssignment).not.toHaveBeenCalled()
    expect(await storage.listAssignments()).toHaveLength(2)
  })

  it('coalesces repeated changes and reports a grouped synchronized result', async () => {
    const user = userEvent.setup()
    let online = false
    const sendAssignment = vi.fn().mockResolvedValue({ affectedRows: 1 })
    const { dataSource, manager, storage } = createTestManager({
      isOnline: () => online,
      sendAssignment,
    })

    render(<FigurantList manager={manager} mutationsEnabled />)

    const calyx = await screen.findByLabelText('Assignment for Calyx Mora (1008)')
    await user.selectOptions(calyx, '81')
    await user.click(
      screen.getByRole('button', {
        name: 'Queue assignment for Calyx Mora (1008)',
      }),
    )
    await user.selectOptions(calyx, '144')
    await user.click(
      screen.getByRole('button', {
        name: 'Queue assignment for Calyx Mora (1008)',
      }),
    )

    expect(await storage.listAssignments()).toHaveLength(1)
    expect((await storage.listAssignments())[0]).toMatchObject({
      assignedExternalUserId: '144',
      revision: 2,
    })

    const ilya = screen.getByLabelText('Assignment for Ilya Venn (1021)')
    await user.selectOptions(ilya, '')
    await user.click(
      screen.getByRole('button', {
        name: 'Queue assignment for Ilya Venn (1021)',
      }),
    )

    online = true
    await act(() => manager.outbox.syncNow())

    expect(await screen.findByText('2 assignments synchronized.')).toBeInTheDocument()
    expect(sendAssignment).toHaveBeenCalledTimes(2)
    expect(dataSource.getFigurants).toHaveBeenCalledTimes(1)
    expect(calyx).toHaveValue('144')
    expect(ilya).toHaveValue('')
  })

  it('shows a rejected assignment for manual review and discard', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    const sendAssignment = vi.fn().mockRejectedValue(
      new ApiError('rejected', {
        status: 400,
        code: 'HTTP_400',
        retryable: false,
      }),
    )
    const { manager } = createTestManager({
      isOnline: () => true,
      sendAssignment,
    })

    render(<FigurantList manager={manager} mutationsEnabled />)

    const calyx = await screen.findByLabelText('Assignment for Calyx Mora (1008)')
    await user.selectOptions(calyx, '81')
    await user.click(
      screen.getByRole('button', {
        name: 'Queue assignment for Calyx Mora (1008)',
      }),
    )

    expect(await screen.findByText(/Orthanc rejected this assignment/)).toBeInTheDocument()
    expect(calyx).toHaveValue('81')
    await user.click(
      screen.getByRole('button', {
        name: 'Discard queued change for Calyx Mora',
      }),
    )

    await waitFor(() => expect(calyx).toHaveValue(''))
    expect(screen.getByText(/0 assignment changes waiting/)).toBeInTheDocument()
    consoleError.mockRestore()
  })

  it('captures a keyboard-wedge card scan and keeps it durable while offline', async () => {
    const user = userEvent.setup()
    const sendCardChange = vi.fn()
    const { manager, storage } = createTestManager({
      isOnline: () => false,
      sendAssignment: vi.fn(),
      sendCardChange,
    })

    render(<FigurantList manager={manager} mutationsEnabled />)

    await user.click(
      await screen.findByRole('button', {
        name: 'Scan card for Calyx Mora (1008)',
      }),
    )
    const scannerInput = screen.getByLabelText('Scan card for Calyx Mora (1008)')
    expect(scannerInput).toHaveFocus()
    await user.type(scannerInput, '1234567890{enter}')

    expect(await screen.findByText(/1 card changes queued/)).toBeInTheDocument()
    expect(sendCardChange).not.toHaveBeenCalled()
    expect(await storage.listCardChanges()).toEqual([
      expect.objectContaining({
        characterId: '1008',
        cardId: '1234567890',
      }),
    ])
    const calyxRow = screen
      .getByLabelText('Assignment for Calyx Mora (1008)')
      .closest('tr')
    expect(within(calyxRow).getByText('1234567890')).toBeInTheDocument()
  })

  it('optimistically moves an already-used card to its newly scanned character', async () => {
    const user = userEvent.setup()
    const { manager } = createTestManager({
      isOnline: () => false,
      sendAssignment: vi.fn(),
    })

    render(<FigurantList manager={manager} mutationsEnabled />)

    await user.click(
      await screen.findByRole('button', {
        name: 'Scan card for Calyx Mora (1008)',
      }),
    )
    await user.type(
      screen.getByLabelText('Scan card for Calyx Mora (1008)'),
      '04-A1-3F-92{enter}',
    )

    const calyxRow = screen
      .getByLabelText('Assignment for Calyx Mora (1008)')
      .closest('tr')
    const naraRow = screen
      .getByLabelText('Assignment for Nara Holt (1094)')
      .closest('tr')
    expect(within(calyxRow).getByText('04-A1-3F-92')).toBeInTheDocument()
    expect(within(naraRow).getByText('No card')).toBeInTheDocument()
  })
})
