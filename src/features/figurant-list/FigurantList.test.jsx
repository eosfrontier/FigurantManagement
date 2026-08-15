import { render, screen, within } from '@testing-library/react'
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
    expect(within(body).getByText(/Nara Holt/)).toBeInTheDocument()
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
})
