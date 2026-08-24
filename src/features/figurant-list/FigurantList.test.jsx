import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/errors.js'
import { createFigurantManager } from '../../data/figurantManager.js'
import { mockApplicationData } from '../../fixtures/mockData.js'
import { createMemoryManagerStorage } from '../../offline/managerStorage.js'
import FigurantList from './FigurantList.jsx'

function createTestManager({ isOnline, sendAssignment }) {
  const figurants = structuredClone(mockApplicationData.figurants)
  figurants.assignableUsers = structuredClone(mockApplicationData.users)
  const dataSource = {
    getFigurants: vi.fn().mockResolvedValue(figurants),
    setFigurantAssignment: sendAssignment,
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
})
