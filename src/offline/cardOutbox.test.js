import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors.js'
import { createCardOutbox } from './cardOutbox.js'
import { createMemoryManagerStorage } from './managerStorage.js'

const calyxCard = {
  characterId: '1008',
  characterName: 'Calyx Mora',
  cardId: '04-A1-3F-92',
}

describe('card outbox', () => {
  it('keeps only the newest offline destination for the same card', async () => {
    let online = false
    const storage = createMemoryManagerStorage()
    const sendCardChange = vi.fn().mockResolvedValue({ affectedRows: 1 })
    const outbox = createCardOutbox({
      storage,
      sendCardChange,
      isOnline: () => online,
      addOnlineListener: () => () => {},
    })

    await outbox.start()
    await outbox.enqueue(calyxCard)
    await outbox.enqueue({
      ...calyxCard,
      characterId: '1021',
      characterName: 'Ilya Venn',
    })

    expect(outbox.getState().items).toEqual([
      expect.objectContaining({
        characterId: '1021',
        cardId: '04-A1-3F-92',
      }),
    ])
    expect(await storage.listCardChanges()).toHaveLength(1)
    expect(sendCardChange).not.toHaveBeenCalled()

    online = true
    await outbox.syncNow()

    expect(sendCardChange).toHaveBeenCalledTimes(1)
    expect(sendCardChange).toHaveBeenCalledWith(
      { characterId: '1021', cardId: '04-A1-3F-92' },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(outbox.getState().notification).toMatchObject({ count: 1 })
  })

  it('coalesces repeated card scans for one character', async () => {
    const storage = createMemoryManagerStorage()
    const outbox = createCardOutbox({
      storage,
      sendCardChange: vi.fn(),
      isOnline: () => false,
      addOnlineListener: () => () => {},
    })

    await outbox.start()
    await outbox.enqueue(calyxCard)
    await outbox.enqueue({ ...calyxCard, cardId: '1234567890' })

    expect(outbox.getState().items).toEqual([
      expect.objectContaining({
        characterId: '1008',
        cardId: '1234567890',
        revision: 2,
      }),
    ])
    expect(await storage.listCardChanges()).toHaveLength(1)
  })

  it('supersedes an in-flight destination when the card is scanned elsewhere', async () => {
    let resolveFirst
    const firstWrite = new Promise((resolve) => {
      resolveFirst = resolve
    })
    const sendCardChange = vi
      .fn()
      .mockReturnValueOnce(firstWrite)
      .mockResolvedValueOnce({ affectedRows: 2 })
    const outbox = createCardOutbox({
      storage: createMemoryManagerStorage(),
      sendCardChange,
      isOnline: () => true,
      addOnlineListener: () => () => {},
    })

    await outbox.start()
    await outbox.enqueue(calyxCard)
    await vi.waitFor(() => expect(sendCardChange).toHaveBeenCalledTimes(1))

    await outbox.enqueue({
      ...calyxCard,
      characterId: '1021',
      characterName: 'Ilya Venn',
    })
    expect(outbox.getState().items).toEqual([
      expect.objectContaining({ characterId: '1021' }),
    ])

    resolveFirst({ affectedRows: 1 })
    await outbox.syncNow()

    expect(sendCardChange).toHaveBeenCalledTimes(2)
    expect(sendCardChange.mock.calls[1][0]).toEqual({
      characterId: '1021',
      cardId: '04-A1-3F-92',
    })
    expect(outbox.getState().items).toHaveLength(0)
    expect(outbox.getState().notification).toMatchObject({ count: 1 })
  })

  it('keeps a permanent rejection for retry or discard', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const storage = createMemoryManagerStorage()
    const outbox = createCardOutbox({
      storage,
      sendCardChange: vi.fn().mockRejectedValue(
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
    await outbox.enqueue(calyxCard)
    await outbox.syncNow()

    expect(outbox.getState()).toMatchObject({
      pendingCount: 0,
      failedCount: 1,
    })
    expect(outbox.getState().items[0].failure).toMatchObject({
      code: 'HTTP_400',
      retryable: false,
    })

    await outbox.discard('1008')
    expect(outbox.getState().items).toHaveLength(0)
    expect(await storage.listCardChanges()).toHaveLength(0)
    consoleError.mockRestore()
  })

  it('restores only the newest persisted destination for a duplicated card', async () => {
    const storage = createMemoryManagerStorage({
      cardChanges: [
        {
          ...calyxCard,
          status: 'syncing',
          createdAt: 10,
          updatedAt: 10,
          nextAttemptAt: 10,
          attempts: 1,
          revision: 1,
          failure: null,
        },
        {
          ...calyxCard,
          characterId: '1021',
          characterName: 'Ilya Venn',
          status: 'pending',
          createdAt: 20,
          updatedAt: 20,
          nextAttemptAt: 20,
          attempts: 0,
          revision: 1,
          failure: null,
        },
      ],
    })
    const outbox = createCardOutbox({
      storage,
      sendCardChange: vi.fn(),
      isOnline: () => false,
      addOnlineListener: () => () => {},
    })

    await outbox.start()

    expect(outbox.getState().items).toEqual([
      expect.objectContaining({
        characterId: '1021',
        status: 'pending',
        nextAttemptAt: 0,
      }),
    ])
    expect(await storage.listCardChanges()).toHaveLength(1)
  })
})
