import { describe, expect, it, vi } from 'vitest'
import { createOrthancDataSource } from './orthancDataSource.js'

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

  it('returns assignable users with the normalized figurant list', async () => {
    const source = createOrthancDataSource({
      client: {
        getGroupsByName: vi.fn().mockResolvedValue([
          { id: '9', parent_id: '1', title: 'Monsterland' },
        ]),
        getUsersByGroup: vi.fn().mockResolvedValue([
          { id: '81', name: 'Alex Crew' },
        ]),
        getActiveFigurants: vi.fn().mockResolvedValue([]),
      },
      groupName: 'monsterland',
    })

    await expect(source.getFigurants()).resolves.toMatchObject({
      items: [],
      assignableUsers: [
        { externalUserId: '81', displayName: 'Alex Crew' },
      ],
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
})
