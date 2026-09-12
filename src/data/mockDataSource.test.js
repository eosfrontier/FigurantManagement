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
})
