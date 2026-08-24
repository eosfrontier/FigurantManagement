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
})
