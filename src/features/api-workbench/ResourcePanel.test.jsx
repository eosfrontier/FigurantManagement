import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ResourcePanel from './ResourcePanel.jsx'

function renderPanel(load) {
  return render(
    <ResourcePanel
      title="Health"
      description="Checks the service."
      load={load}
      loadAllVersion={0}
      renderSummary={(data) => <span>{data.healthy ? 'Healthy' : 'Unhealthy'}</span>}
      renderData={(data) => <pre>{JSON.stringify(data)}</pre>}
    />,
  )
}

describe('ResourcePanel', () => {
  it('loads a resource only after the user asks for it', async () => {
    const user = userEvent.setup()
    const load = vi.fn().mockResolvedValue({ healthy: true })
    renderPanel(load)

    expect(load).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Load' }))

    expect(await screen.findByText('Healthy')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
  })

  it('shows a safe error and allows retrying', async () => {
    const user = userEvent.setup()
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('internal details'))
      .mockResolvedValueOnce({ healthy: true })
    renderPanel(load)

    await user.click(screen.getByRole('button', { name: 'Load' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something unexpected went wrong',
    )

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Healthy')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })
})
