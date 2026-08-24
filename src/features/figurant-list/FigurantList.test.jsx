import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { mockApplicationData } from '../../fixtures/mockData.js'
import FigurantList from './FigurantList.jsx'

describe('FigurantList', () => {
  it('loads automatically and filters normalized characters', async () => {
    const user = userEvent.setup()
    const loadFigurants = vi.fn().mockResolvedValue(mockApplicationData.figurants)
    render(<FigurantList loadFigurants={loadFigurants} />)

    expect(await screen.findByText(/Showing 4 of 4 characters/)).toBeInTheDocument()
    expect(loadFigurants).toHaveBeenCalledTimes(1)

    await user.type(screen.getByLabelText('Filter Faction'), 'bastion')
    expect(screen.getByText(/Showing 1 of 4 characters/)).toBeInTheDocument()
    const body = screen.getAllByRole('rowgroup')[1]
    expect(within(body).getByText('Dockmaster Nara Holt')).toBeInTheDocument()
    expect(within(body).queryByText('Calyx Mora')).not.toBeInTheDocument()
  })

  it('shows safe failures and retries without remounting', async () => {
    const user = userEvent.setup()
    const loadFigurants = vi
      .fn()
      .mockRejectedValueOnce(new Error('internal detail'))
      .mockResolvedValueOnce(mockApplicationData.figurants)
    render(<FigurantList loadFigurants={loadFigurants} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something unexpected went wrong',
    )
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(/Showing 4 of 4 characters/)).toBeInTheDocument()
    expect(loadFigurants).toHaveBeenCalledTimes(2)
  })

  it('assigns an NPC once, prevents double submission and refreshes', async () => {
    const user = userEvent.setup()
    const initial = structuredClone(mockApplicationData.figurants)
    initial.assignableUsers = structuredClone(mockApplicationData.users)
    const updated = structuredClone(initial)
    const calyx = updated.items.find((item) => item.characterId === '1008')
    calyx.assignedExternalUserId = '81'
    calyx.assignedDisplayName = 'Alex Crew'

    let resolveMutation
    const mutation = new Promise((resolve) => {
      resolveMutation = resolve
    })
    const setFigurantAssignment = vi.fn().mockReturnValue(mutation)
    const loadFigurants = vi
      .fn()
      .mockResolvedValueOnce(initial)
      .mockResolvedValueOnce(updated)

    render(
      <FigurantList
        loadFigurants={loadFigurants}
        setFigurantAssignment={setFigurantAssignment}
        mutationsEnabled
      />,
    )

    const select = await screen.findByLabelText(
      'Assignment for Calyx Mora (1008)',
    )
    await user.selectOptions(select, '81')
    const save = screen.getByRole('button', {
      name: 'Save assignment for Calyx Mora (1008)',
    })
    await user.click(save)

    expect(setFigurantAssignment).toHaveBeenCalledTimes(1)
    expect(save).toBeDisabled()
    await user.click(save)
    expect(setFigurantAssignment).toHaveBeenCalledTimes(1)

    resolveMutation({ affectedRows: 1 })
    expect(await screen.findByText('The assignment for Calyx Mora was saved.')).toBeInTheDocument()
    expect(loadFigurants).toHaveBeenCalledTimes(2)
    expect(
      screen.getByLabelText('Assignment for Calyx Mora (1008)'),
    ).toHaveValue('81')
  })

  it('unassigns an NPC and allows retrying a failed mutation', async () => {
    const user = userEvent.setup()
    const initial = structuredClone(mockApplicationData.figurants)
    initial.assignableUsers = structuredClone(mockApplicationData.users)
    const updated = structuredClone(initial)
    const ilya = updated.items.find((item) => item.characterId === '1021')
    ilya.assignedExternalUserId = null
    ilya.assignedDisplayName = null
    const setFigurantAssignment = vi
      .fn()
      .mockRejectedValueOnce(new Error('private upstream detail'))
      .mockResolvedValueOnce({ affectedRows: 1 })
    const loadFigurants = vi
      .fn()
      .mockResolvedValueOnce(initial)
      .mockResolvedValueOnce(updated)

    render(
      <FigurantList
        loadFigurants={loadFigurants}
        setFigurantAssignment={setFigurantAssignment}
        mutationsEnabled
      />,
    )

    await user.selectOptions(
      await screen.findByLabelText('Assignment for Ilya Venn (1021)'),
      '',
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Save assignment for Ilya Venn (1021)',
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Assignment failed. Something unexpected went wrong',
    )
    expect(setFigurantAssignment).toHaveBeenLastCalledWith(
      { characterId: '1021', assignedExternalUserId: null },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )

    await user.click(screen.getByRole('button', { name: 'Retry assignment' }))
    await waitFor(() => expect(setFigurantAssignment).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('The assignment for Ilya Venn was saved.')).toBeInTheDocument()
  })
})
