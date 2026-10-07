import { describe, expect, it } from 'vitest'
import { createMockDataSource } from './mockDataSource.js'

describe('createMockDataSource assignment', () => {
  it('assigns and unassigns without changing the shared fixtures', async () => {
    const source = createMockDataSource({ delayMs: 0 })

    await expect(
      source.setFigurantAssignment({
        characterId: '1008',
        assignedExternalUserId: '81',
      }),
    ).resolves.toMatchObject({ affectedRows: 1 })
    expect(
      (await source.getFigurants()).items.find(
        (item) => item.characterId === '1008',
      ),
    ).toMatchObject({
      assignedExternalUserId: '81',
      assignedDisplayName: 'Alex Crew',
    })

    await source.setFigurantAssignment({
      characterId: '1008',
      assignedExternalUserId: null,
    })
    expect(
      (await source.getFigurants()).items.find(
        (item) => item.characterId === '1008',
      ),
    ).toMatchObject({
      assignedExternalUserId: null,
      assignedDisplayName: null,
    })

    const freshSource = createMockDataSource({ delayMs: 0 })
    expect(
      (await freshSource.getFigurants()).items.find(
        (item) => item.characterId === '1008',
      ).assignedExternalUserId,
    ).toBeNull()
  })

  it('replaces a card and moves an already-used card to the new character', async () => {
    const source = createMockDataSource({ delayMs: 0 })

    await expect(
      source.setFigurantCard({
        characterId: '1008',
        cardId: '04-A1-3F-92',
      }),
    ).resolves.toMatchObject({ affectedRows: 2 })

    const figurants = (await source.getFigurants()).items
    expect(
      figurants.find((item) => item.characterId === '1008'),
    ).toMatchObject({ cardId: '04-A1-3F-92' })
    expect(
      figurants.find((item) => item.characterId === '1094'),
    ).toMatchObject({ cardId: null })
  })

  it('creates an unassigned prepared character in isolated mock state', async () => {
    const source = createMockDataSource({ delayMs: 0 })
    const draft = {
      characterName: 'Mara Venn',
      factionId: 'aquila',
      threatAssessment: 2,
      customsDisposition: 'ACCESS GRANTED',
      bastionClearance: 1,
      iccNumber: '7002 10000 0000',
      bloodType: 'O',
      birthDate: '15-7-220NT',
      homePlanet: 'Accipiter',
    }

    await expect(source.isIccNumberAvailable(draft.iccNumber)).resolves.toBe(true)
    const creation = await source.createPreparedFigurant(draft)

    expect(creation.figurant).toMatchObject({
      characterName: 'Mara Venn',
      cardId: null,
      assignedExternalUserId: null,
    })
    await expect(source.isIccNumberAvailable(draft.iccNumber)).resolves.toBe(false)
    expect(
      (await source.getFigurants()).items.find(
        (item) => item.characterId === creation.characterId,
      ),
    ).toMatchObject({ characterName: 'Mara Venn' })
  })

  it('updates character details without changing card or crew assignment', async () => {
    const source = createMockDataSource({ delayMs: 0 })
    const before = (await source.getFigurants()).items.find(
      (item) => item.characterId === '1094',
    )
    const details = {
      characterName: 'Nara Vale',
      factionId: before.factionId,
      rank: before.rank,
      threatAssessment: before.threatAssessment,
      customsDisposition: 'ACCESS GRANTED',
      customsNotes: 'Updated customs note.',
      bastionClearance: before.bastionClearance,
      iccNumber: before.iccNumber,
      bloodType: before.bloodType,
      birthDate: before.birthDate,
      homePlanet: before.homePlanet,
      plotReference: before.plotReference,
      recurring: false,
    }

    await source.updateFigurantDetails({ characterId: '1094', details })
    const updated = (await source.getFigurants()).items.find(
      (item) => item.characterId === '1094',
    )

    expect(updated).toMatchObject({
      characterName: 'Nara Vale',
      customsDisposition: 'ACCESS GRANTED',
      customsNotes: 'Updated customs note.',
      recurring: false,
      status: 'figurant',
      cardId: before.cardId,
      assignedExternalUserId: before.assignedExternalUserId,
    })
  })

  it('soft-deletes a character from the active mock roster', async () => {
    const source = createMockDataSource({ delayMs: 0 })

    await expect(source.softDeleteFigurant('1094')).resolves.toMatchObject({
      characterId: '1094',
      deletedCount: 1,
      alreadyDeleted: false,
    })
    expect(
      (await source.getFigurants()).items.some(
        (item) => item.characterId === '1094',
      ),
    ).toBe(false)
    await expect(source.softDeleteFigurant('1094')).resolves.toMatchObject({
      deletedCount: 0,
      alreadyDeleted: true,
    })
  })
})
