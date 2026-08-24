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

  it('encodes assignment and unassignment using the current Orthanc contract', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(1))
    const client = createOrthancClient({ fetchImpl })

    await client.setFigurantAssignment('410', '719')
    await client.setFigurantAssignment('410', null)

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      '/dev-api/orthanc/chars_figu/',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          id: '410',
          figurant: '{"figu_accountID":"719"}',
        }),
      }),
    )
    expect(fetchImpl.mock.calls[1][1].headers).toMatchObject({
      id: '410',
      figurant: '{"figu_accountID":"null"}',
    })
  })

  it('rejects non-numeric identifiers before sending a mutation', async () => {
    const fetchImpl = vi.fn()
    const client = createOrthancClient({ fetchImpl })

    expect(() => client.setFigurantAssignment('410 OR 1=1', '719')).toThrow(
      'characterId must be a positive numeric identifier',
    )
    expect(() => client.setFigurantAssignment('410', 'not-an-id')).toThrow(
      'assignedExternalUserId must be a positive numeric identifier',
    )
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
