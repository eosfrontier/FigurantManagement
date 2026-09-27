import { describe, expect, it, vi } from 'vitest'
import { createWatchtowerClient } from './watchtowerClient.js'

describe('createWatchtowerClient', () => {
  it('retrieves the public time route without credentials', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('{"iYear":240}'),
    })
    const client = createWatchtowerClient({ fetchImpl })

    await client.getCurrentTime()

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.eosfrontier.space/watchtower/time/',
      expect.objectContaining({
        method: 'GET',
        headers: expect.not.objectContaining({ token: expect.anything() }),
      }),
    )
  })
})
