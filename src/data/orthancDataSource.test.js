import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors.js'
import { createOrthancDataSource } from './orthancDataSource.js'

function rawFigurant(overrides = {}) {
  return {
    characterID: '42',
    character_name: 'Recurring Envoy',
    faction: 'sona',
    status: 'figurant-recurring',
    card_id: null,
    rank: 'Envoy',
    threat_assessment: '3',
    douane_disposition: 'ACCESS GRANTED',
    douane_notes: null,
    bastion_clearance: '2',
    ICC_number: null,
    bloodtype: null,
    ic_birthday: null,
    homeplanet: null,
    figu_accountID: '144',
    figu_name: 'Untrusted historical join name',
    plotname: null,
    ...overrides,
  }
}

describe('createOrthancDataSource', () => {
  it('resolves the configured group and requests only current-event users', async () => {
    const client = {
      getGroupsByName: vi.fn().mockResolvedValue([
        { id: '9', parent_id: '1', title: 'Monsterland' },
      ]),
      getUsersByGroup: vi.fn().mockResolvedValue([
        { id: '81', name: 'Alex Crew' },
      ]),
    }
    const source = createOrthancDataSource({
      client,
      groupName: 'monsterland',
    })

    await expect(source.getAssignableUsers()).resolves.toEqual([
      { externalUserId: '81', displayName: 'Alex Crew' },
    ])
    expect(client.getGroupsByName).toHaveBeenCalledWith('monsterland', {
      signal: undefined,
    })
    expect(client.getUsersByGroup).toHaveBeenCalledWith('9', {
      currentEvent: true,
      signal: undefined,
    })
  })

  it('fails explicitly when the configured group cannot be resolved', async () => {
    const source = createOrthancDataSource({
      client: {
        getGroupsByName: vi.fn().mockResolvedValue([]),
      },
      groupName: 'monsterland',
    })

    await expect(source.getAssignableUsers()).rejects.toMatchObject({
      code: 'GROUP_NOT_FOUND',
    })
  })

  it('hydrates existing assignments from all group users but only exposes current-event users as assignable', async () => {
    const getUsersByGroup = vi.fn().mockImplementation(
      (_groupId, { currentEvent }) =>
        Promise.resolve(
          currentEvent
            ? [{ id: '81', name: 'Alex Current' }]
            : [
                { id: '81', name: 'Alex Current' },
                { id: '144', name: 'Morgan Recurring' },
              ],
        ),
    )
    const source = createOrthancDataSource({
      client: {
        getGroupsByName: vi.fn().mockResolvedValue([
          { id: '9', parent_id: '1', title: 'Monsterland' },
        ]),
        getUsersByGroup,
        getActiveFigurants: vi.fn().mockResolvedValue([rawFigurant()]),
      },
      groupName: 'monsterland',
    })

    await expect(source.getFigurants()).resolves.toMatchObject({
      items: [
        {
          assignedExternalUserId: '144',
          assignedDisplayName: 'Morgan Recurring',
        },
      ],
      assignableUsers: [
        { externalUserId: '81', displayName: 'Alex Current' },
      ],
    })
    expect(getUsersByGroup).toHaveBeenCalledWith('9', {
      currentEvent: true,
      signal: undefined,
    })
    expect(getUsersByGroup).toHaveBeenCalledWith('9', {
      currentEvent: false,
      signal: undefined,
    })
  })

  it('normalizes assignment mutation results', async () => {
    const client = { setFigurantAssignment: vi.fn().mockResolvedValue('1') }
    const source = createOrthancDataSource({ client, groupName: 'monsterland' })

    await expect(
      source.setFigurantAssignment({
        characterId: '410',
        assignedExternalUserId: null,
      }),
    ).resolves.toEqual({
      characterId: '410',
      assignedExternalUserId: null,
      affectedRows: 1,
    })
    expect(client.setFigurantAssignment).toHaveBeenCalledWith(
      '410',
      null,
      { signal: undefined },
    )
  })

  it('normalizes card replacement results', async () => {
    const client = { setFigurantCard: vi.fn().mockResolvedValue('2') }
    const source = createOrthancDataSource({ client, groupName: 'monsterland' })

    await expect(
      source.setFigurantCard({
        characterId: '410',
        cardId: ' 04-A1-3F-92 ',
      }),
    ).resolves.toEqual({
      characterId: '410',
      cardId: '04-A1-3F-92',
      affectedRows: 2,
    })
    expect(client.setFigurantCard).toHaveBeenCalledWith(
      '410',
      '04-A1-3F-92',
      { signal: undefined },
    )
  })

  it('maps and normalizes prepared-character creation', async () => {
    const client = {
      createPreparedFigurant: vi.fn().mockResolvedValue('1201'),
    }
    const source = createOrthancDataSource({ client, groupName: 'monsterland' })
    const draft = {
      characterName: 'Mara Venn',
      factionId: 'aquila',
      rank: '',
      threatAssessment: 2,
      customsDisposition: 'ACCESS GRANTED',
      customsNotes: '',
      bastionClearance: 1,
      iccNumber: '7002 10000 0000',
      bloodType: 'O',
      birthDate: '15-7-220NT',
      homePlanet: 'Accipiter',
      plotReference: '',
      recurring: false,
    }

    await expect(source.createPreparedFigurant(draft)).resolves.toMatchObject({
      characterId: '1201',
      figurant: {
        characterId: '1201',
        characterName: 'Mara Venn',
        cardId: null,
        assignedExternalUserId: null,
      },
    })
    expect(client.createPreparedFigurant).toHaveBeenCalledWith(
      expect.objectContaining({
        card_id: null,
        character_name: 'Mara Venn',
        icc_number: '7002 10000 0000',
        figu_accountID: null,
      }),
      { signal: undefined },
    )
  })

  it('maps editable details without sending card or assignment fields', async () => {
    const client = { updateFigurantDetails: vi.fn().mockResolvedValue('1') }
    const source = createOrthancDataSource({ client, groupName: 'monsterland' })
    const details = {
      characterName: 'Mara Vale',
      factionId: 'aquila',
      rank: 'Courier',
      threatAssessment: 3,
      customsDisposition: 'DETAIN',
      customsNotes: 'Inspect case.',
      bastionClearance: 2,
      iccNumber: '7002 10000 0000',
      bloodType: 'O',
      birthDate: '15-7-220NT',
      homePlanet: 'Accipiter',
      plotReference: 'Quiet envoy',
      recurring: true,
    }

    await expect(
      source.updateFigurantDetails({ characterId: '1201', details }),
    ).resolves.toEqual({ characterId: '1201', details, affectedRows: 1 })

    const payload = client.updateFigurantDetails.mock.calls[0][1]
    expect(payload).toMatchObject({
      character_name: 'Mara Vale',
      douane_disposition: 'DETAIN',
      douane_notes: 'Inspect case.',
      recurring: true,
    })
    expect(payload).not.toHaveProperty('card_id')
    expect(payload).not.toHaveProperty('figu_accountID')
  })

  it('rejects a non-ID success payload from prepared-character creation', async () => {
    const source = createOrthancDataSource({
      client: {
        createPreparedFigurant: vi.fn().mockResolvedValue('database error'),
      },
      groupName: 'monsterland',
    })

    await expect(
      source.createPreparedFigurant({
        characterName: 'Mara Venn',
        factionId: 'aquila',
        threatAssessment: 2,
        customsDisposition: 'ACCESS GRANTED',
        bastionClearance: 1,
        iccNumber: '7002 10000 0000',
        bloodType: 'O',
        birthDate: '15-7-220NT',
        homePlanet: 'Accipiter',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CREATE_RESULT' })
  })

  it('normalizes soft deletion and treats an already-deleted record as done', async () => {
    const client = {
      softDeleteFigurant: vi
        .fn()
        .mockResolvedValueOnce('1 figuranten deleted.')
        .mockRejectedValueOnce(
          new ApiError('not found', { status: 404, code: 'HTTP_404' }),
        ),
    }
    const source = createOrthancDataSource({ client, groupName: 'monsterland' })

    await expect(source.softDeleteFigurant('1201')).resolves.toEqual({
      characterId: '1201',
      deletedCount: 1,
      message: '1 figuranten deleted.',
      alreadyDeleted: false,
    })
    await expect(source.softDeleteFigurant('1201')).resolves.toMatchObject({
      characterId: '1201',
      deletedCount: 0,
      alreadyDeleted: true,
    })
  })
})
