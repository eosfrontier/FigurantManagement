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

  it('encodes a validated replacement card using the current Orthanc contract', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(1))
    const client = createOrthancClient({ fetchImpl })

    await client.setFigurantCard('410', ' 04-A1-3F-92 ')

    expect(fetchImpl).toHaveBeenCalledWith(
      '/dev-api/orthanc/chars_figu/',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          id: '410',
          figurant: '{"card_id":"04-A1-3F-92"}',
        }),
      }),
    )
  })

  it('rejects empty or unsafe card values before sending a mutation', () => {
    const fetchImpl = vi.fn()
    const client = createOrthancClient({ fetchImpl })

    expect(() => client.setFigurantCard('410', '')).toThrow(
      'cardId must contain 1 to 64 letters, numbers, colons, or hyphens',
    )
    expect(() => client.setFigurantCard('410', 'card "value"')).toThrow(
      'cardId must contain 1 to 64 letters, numbers, colons, or hyphens',
    )
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('updates details without allowing card or assignment fields', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(1))
    const client = createOrthancClient({ fetchImpl })
    const figurant = {
      character_name: 'Calyx Vale',
      douane_notes: 'Updated note',
    }

    await client.updateFigurantDetails('410', figurant)

    expect(fetchImpl).toHaveBeenCalledWith(
      '/dev-api/orthanc/chars_figu/',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          id: '410',
          figurant: JSON.stringify(figurant),
        }),
      }),
    )
    expect(() =>
      client.updateFigurantDetails('410', { ...figurant, card_id: null }),
    ).toThrow('must not include card or assignment fields')
    expect(() =>
      client.updateFigurantDetails('410', {
        ...figurant,
        figu_accountID: null,
      }),
    ).toThrow('must not include card or assignment fields')
  })

  it('creates only an explicitly unassigned prepared figurant', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse('1201'))
    const client = createOrthancClient({ fetchImpl })
    const figurant = {
      card_id: null,
      character_name: 'Mara Venn',
      faction: 'aquila',
      figu_accountID: null,
    }

    await client.createPreparedFigurant(figurant)

    expect(fetchImpl).toHaveBeenCalledWith(
      '/dev-api/orthanc/chars_figu/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ figurant: JSON.stringify(figurant) }),
      }),
    )
    expect(() =>
      client.createPreparedFigurant({ ...figurant, card_id: '1234' }),
    ).toThrow('must not have a card')
  })

  it('checks ICC numbers across all character statuses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse([]))
    const client = createOrthancClient({ fetchImpl })

    await client.getCharacterByIccNumber('7002 10000 0000')

    expect(fetchImpl).toHaveBeenCalledWith(
      '/dev-api/orthanc/chars_all/',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          all_statuses: '1',
          icc_number: '7002 10000 0000',
        }),
      }),
    )
  })
})
