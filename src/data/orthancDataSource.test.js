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
})
