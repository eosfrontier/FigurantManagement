import { describe, expect, it, vi } from 'vitest'
import { createJoomlaSessionClient } from './joomlaSessionClient.js'

describe('createJoomlaSessionClient', () => {
  it('uses the same-origin Joomla helper with cookies and no caching', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('{"id":7,"groups":[30]}'),
    })
    const client = createJoomlaSessionClient({ fetchImpl })

    await client.getSession()

    expect(fetchImpl).toHaveBeenCalledWith(
      '/assets/idandgroups.php',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: expect.objectContaining({ Accept: 'application/json' }),
      }),
    )
  })
})
