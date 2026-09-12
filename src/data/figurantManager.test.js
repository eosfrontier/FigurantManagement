import { describe, expect, it, vi } from 'vitest'
import { mockApplicationData } from '../fixtures/mockData.js'
import { createMemoryManagerStorage } from '../offline/managerStorage.js'
import {
  applyAssignmentOperations,
  applyCardOperations,
  createFigurantManager,
} from './figurantManager.js'

describe('figurant manager', () => {
  it('caches a successful load and falls back to it after a failure', async () => {
    const data = structuredClone(mockApplicationData.figurants)
    data.assignableUsers = structuredClone(mockApplicationData.users)
    const dataSource = {
      getFigurants: vi
        .fn()
        .mockResolvedValueOnce(data)
        .mockRejectedValueOnce(new Error('offline')),
    }
    const manager = createFigurantManager({
      dataSource,
      storage: createMemoryManagerStorage(),
      now: () => 1234,
    })

    const fresh = await manager.loadFigurants()
    const cached = await manager.loadFigurants()

    expect(fresh.cacheInfo).toEqual({ source: 'network', savedAt: 1234 })
    expect(cached.items).toEqual(data.items)
    expect(cached.cacheInfo).toMatchObject({
      source: 'cache',
      savedAt: 1234,
    })
  })

  it('falls back to cached data when the network read exceeds its deadline', async () => {
    const data = structuredClone(mockApplicationData.figurants)
    const storage = createMemoryManagerStorage({
      snapshot: { value: data, savedAt: 500 },
    })
    const dataSource = {
      getFigurants: vi.fn(({ signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          )
        }),
      ),
    }
    const manager = createFigurantManager({
      dataSource,
      storage,
      readTimeoutMs: 5,
    })

    const result = await manager.loadFigurants()

    expect(result.items).toEqual(data.items)
    expect(result.cacheInfo).toMatchObject({ source: 'cache', savedAt: 500 })
  })

  it('projects queued assignments without mutating the confirmed result', () => {
    const original = structuredClone(mockApplicationData.figurants)
    original.assignableUsers = structuredClone(mockApplicationData.users)
    const projected = applyAssignmentOperations(original, [
      {
        characterId: '1008',
        assignedExternalUserId: '81',
        assignedDisplayName: null,
      },
    ])

    expect(
      projected.items.find((item) => item.characterId === '1008'),
    ).toMatchObject({
      assignedExternalUserId: '81',
      assignedDisplayName: 'Alex Crew',
    })
    expect(
      original.items.find((item) => item.characterId === '1008'),
    ).toMatchObject({
      assignedExternalUserId: null,
      assignedDisplayName: null,
    })
  })

  it('projects card replacement and clears its previous holder', () => {
    const original = structuredClone(mockApplicationData.figurants)
    const projected = applyCardOperations(original, [
      {
        characterId: '1008',
        cardId: '04-A1-3F-92',
      },
    ])

    expect(
      projected.items.find((item) => item.characterId === '1008'),
    ).toMatchObject({ cardId: '04-A1-3F-92' })
    expect(
      projected.items.find((item) => item.characterId === '1094'),
    ).toMatchObject({ cardId: null })
    expect(
      original.items.find((item) => item.characterId === '1094'),
    ).toMatchObject({ cardId: '04-A1-3F-92' })
  })
})
