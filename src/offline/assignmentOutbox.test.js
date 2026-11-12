import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors.js'
import { createAssignmentOutbox } from './assignmentOutbox.js'
import { createMemoryManagerStorage } from './managerStorage.js'

const solaceToAlex = {
  characterId: '1186',
  characterName: 'Solace Prym',
  assignedExternalUserId: '787',
  assignedDisplayName: 'Alex Jongenengel',
  previousAssignedExternalUserId: null,
  previousAssignedDisplayName: null,
}

describe('assignment outbox', () => {
  it('persists and coalesces offline changes before synchronizing', async () => {
    let online = false
    const storage = createMemoryManagerStorage()
    const sendAssignment = vi.fn().mockResolvedValue({ affectedRows: 1 })
    const outbox = createAssignmentOutbox({
      storage,
      sendAssignment,
      isOnline: () => online,
      addOnlineListener: () => () => {},
    })

    await outbox.start()
    await outbox.enqueue(solaceToAlex)
    await outbox.enqueue({
      ...solaceToAlex,
      assignedExternalUserId: null,
      assignedDisplayName: null,
    })

    expect(sendAssignment).not.toHaveBeenCalled()
    expect(outbox.getState().items).toHaveLength(1)
    expect(outbox.getState().items[0]).toMatchObject({
      characterId: '1186',
      assignedExternalUserId: null,
      revision: 2,
    })
    expect(await storage.listAssignments()).toHaveLength(1)

    online = true
    await outbox.syncNow()

    expect(sendAssignment).toHaveBeenCalledTimes(1)
    expect(sendAssignment).toHaveBeenCalledWith(
      { characterId: '1186', assignedExternalUserId: null },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(outbox.getState().items).toHaveLength(0)
    expect(outbox.getState().notification).toMatchObject({ count: 1 })
    expect(await storage.listAssignments()).toHaveLength(0)
  })

  it('preserves a newer change queued while an older revision is in flight', async () => {
    let resolveFirst
    const firstWrite = new Promise((resolve) => {
      resolveFirst = resolve
    })
    const sendAssignment = vi
      .fn()
      .mockReturnValueOnce(firstWrite)
      .mockResolvedValueOnce({ affectedRows: 1 })
    const outbox = createAssignmentOutbox({
      storage: createMemoryManagerStorage(),
      sendAssignment,
      isOnline: () => true,
      addOnlineListener: () => () => {},
    })

    await outbox.start()
    await outbox.enqueue(solaceToAlex)
    await vi.waitFor(() => expect(sendAssignment).toHaveBeenCalledTimes(1))

    await outbox.enqueue({
      ...solaceToAlex,
      assignedExternalUserId: null,
      assignedDisplayName: null,
    })
    expect(outbox.getState().items[0]).toMatchObject({
      assignedExternalUserId: null,
      revision: 2,
    })

    resolveFirst({ affectedRows: 1 })
    await outbox.syncNow()

    expect(sendAssignment).toHaveBeenCalledTimes(2)
    expect(sendAssignment.mock.calls[1][0]).toEqual({
      characterId: '1186',
      assignedExternalUserId: null,
    })
    expect(outbox.getState().items).toHaveLength(0)
  })

  it('retries transient failures and treats an already-applied write as success', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    let timestamp = 1_000
    const sendAssignment = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError('timeout', { code: 'HTTP_524', retryable: true }),
      )
      .mockResolvedValueOnce({ affectedRows: 0 })
    const outbox = createAssignmentOutbox({
      storage: createMemoryManagerStorage(),
      sendAssignment,
      now: () => timestamp,
      retryBaseMs: 500,
      isOnline: () => true,
      addOnlineListener: () => () => {},
    })

    await outbox.start()
    await outbox.enqueue(solaceToAlex)
    await outbox.syncNow()

    expect(outbox.getState().items[0]).toMatchObject({
      status: 'pending',
      attempts: 1,
      nextAttemptAt: 1_500,
    })

    timestamp = 1_500
    await outbox.syncNow()

    expect(sendAssignment).toHaveBeenCalledTimes(2)
    expect(outbox.getState().items).toHaveLength(0)
    expect(outbox.getState().notification.count).toBe(1)
    consoleError.mockRestore()
  })

  it('keeps permanent failures for manual retry or discard', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const sendAssignment = vi
      .fn()
      .mockRejectedValue(
        new ApiError('rejected', {
          status: 400,
          code: 'HTTP_400',
          retryable: false,
        }),
      )
    const outbox = createAssignmentOutbox({
      storage: createMemoryManagerStorage(),
      sendAssignment,
      isOnline: () => true,
      addOnlineListener: () => () => {},
    })

    await outbox.start()
    await outbox.enqueue(solaceToAlex)
    await outbox.syncNow()

    expect(outbox.getState()).toMatchObject({
      pendingCount: 0,
      failedCount: 1,
    })
    expect(outbox.getState().items[0].failure).toMatchObject({
      code: 'HTTP_400',
      retryable: false,
    })

    await outbox.discard('1186')
    expect(outbox.getState().items).toHaveLength(0)
    consoleError.mockRestore()
  })

  it('restores an interrupted syncing item as pending on the next start', async () => {
    const storage = createMemoryManagerStorage({
      assignments: [
        {
          ...solaceToAlex,
          status: 'syncing',
          createdAt: 10,
          updatedAt: 10,
          nextAttemptAt: 10,
          attempts: 1,
          revision: 1,
          failure: null,
        },
      ],
    })
    const outbox = createAssignmentOutbox({
      storage,
      sendAssignment: vi.fn(),
      isOnline: () => false,
      addOnlineListener: () => () => {},
    })

    await outbox.start()

    expect(outbox.getState().items[0]).toMatchObject({
      characterId: '1186',
      status: 'pending',
      nextAttemptAt: 0,
    })
  })
})
