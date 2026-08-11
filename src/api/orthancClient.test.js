import { describe, expect, it, vi } from 'vitest'
import { createOrthancClient } from './orthancClient.js'

function jsonResponse(data) {
  return {
    ok: true,
    status: 200,
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  }
}

describe('createOrthancClient', () => {
  it('encapsulates the headers for active figurants', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse([]))
    const client = createOrthancClient({ fetchImpl })

    await client.getActiveFigurants()

    expect(fetchImpl).toHaveBeenCalledWith(
      '/dev-api/orthanc/chars_figu/',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ all_figurants: '1' }),
      }),
    )
  })

  it('encapsulates current-event user filtering without a browser token', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse([]))
    const client = createOrthancClient({ fetchImpl })

    await client.getUsersByGroup('29', { currentEvent: true })

    const [, options] = fetchImpl.mock.calls[0]
    expect(options.headers).toMatchObject({
      group_id: '29',
      current_event: '1',
    })
    expect(options.headers).not.toHaveProperty('token')
  })
})
