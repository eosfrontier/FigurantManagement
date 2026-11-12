import { describe, expect, it, vi } from 'vitest'
import { createSessionDataSource } from './sessionDataSource.js'

const managerGroupIds = ['30', '36']

describe('createSessionDataSource', () => {
  it('returns a normalized mock session without making a request', async () => {
    const fetchImpl = vi.fn()
    const getSession = createSessionDataSource({
      config: {
        mode: 'mock',
        managerGroupIds,
        mockUser: { id: 7, groups: [30] },
      },
      fetchImpl,
    })

    await expect(getSession()).resolves.toMatchObject({
      externalUserId: '7',
      canManageFigurants: true,
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
