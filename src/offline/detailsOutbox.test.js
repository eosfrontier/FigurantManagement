import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors.js'
import { createDetailsOutbox } from './detailsOutbox.js'
import { createMemoryManagerStorage } from './managerStorage.js'

const originalDetails = {
  characterName: 'Calyx Mora',
  factionId: 'aquila',
  rank: 'Courier',
  threatAssessment: 1,
  customsDisposition: 'ACCESS PENDING',
  customsNotes: null,
  bastionClearance: 1,
  iccNumber: '7001 10000 0001',
  bloodType: 'O',
  birthDate: '12-6-218NT',
  homePlanet: 'Accipiter',
  plotReference: 'Missing signal',
  recurring: false,
}

describe('character details outbox', () => {
  it('coalesces offline edits and synchronizes only the newest full record', async () => {
    let online = false
    const storage = createMemoryManagerStorage()
    const sendDetails = vi.fn().mockResolvedValue({ affectedRows: 1 })
    const outbox = createDetailsOutbox({
      storage,
      sendDetails,
      isOnline: () => online,
      addOnlineListener: () => () => {},
    })

    await outbox.start()
    await outbox.enqueue({
      characterId: '1008',
      characterName: originalDetails.characterName,
      details: { ...originalDetails, customsNotes: 'First note' },
      previousDetails: originalDetails,
    })
    await outbox.enqueue({
      characterId: '1008',
      characterName: originalDetails.characterName,
      details: {
        ...originalDetails,
        characterName: 'Calyx Vale',
        customsNotes: 'Final note',
      },
      previousDetails: { ...originalDetails, customsNotes: 'First note' },
    })

    expect(await storage.listDetailsChanges()).toEqual([
      expect.objectContaining({
        revision: 2,
        previousDetails: originalDetails,
        details: expect.objectContaining({
          characterName: 'Calyx Vale',
          customsNotes: 'Final note',
        }),
      }),
    ])
    expect(sendDetails).not.toHaveBeenCalled()

    online = true
    await outbox.syncNow()

    expect(sendDetails).toHaveBeenCalledTimes(1)
    expect(sendDetails).toHaveBeenCalledWith(
      {
        characterId: '1008',
        details: expect.objectContaining({ characterName: 'Calyx Vale' }),
      },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(outbox.getState().notification).toMatchObject({ count: 1 })
    expect(await storage.listDetailsChanges()).toHaveLength(0)
  })

  it('keeps a permanent rejection for review or discard', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const storage = createMemoryManagerStorage()
    const outbox = createDetailsOutbox({
      storage,
      sendDetails: vi.fn().mockRejectedValue(
        new ApiError('rejected', {
          status: 400,
          code: 'HTTP_400',
          retryable: false,
        }),
      ),
      isOnline: () => true,
      addOnlineListener: () => () => {},
    })

    await outbox.start()
    await outbox.enqueue({
      characterId: '1008',
      characterName: originalDetails.characterName,
      details: { ...originalDetails, customsNotes: 'Rejected note' },
      previousDetails: originalDetails,
    })
    await outbox.syncNow()

    expect(outbox.getState()).toMatchObject({ pendingCount: 0, failedCount: 1 })
    await outbox.discard('1008')
    expect(outbox.getState().items).toHaveLength(0)
    expect(await storage.listDetailsChanges()).toHaveLength(0)
    consoleError.mockRestore()
  })
})
