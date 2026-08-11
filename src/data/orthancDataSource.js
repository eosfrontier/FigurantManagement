import { ContractError } from '../api/errors.js'
import {
  normalizeCurrentEvent,
  normalizeFigurants,
  normalizeGroups,
  normalizeHealth,
  normalizeUsers,
} from '../api/normalizers.js'

function selectGroup(groups, groupName) {
  const matches = groups.filter(
    (group) => group.title.toLowerCase() === groupName.toLowerCase(),
  )

  if (matches.length !== 1) {
    throw new ContractError(
      `Expected exactly one Orthanc group named "${groupName}".`,
      {
        code: matches.length === 0 ? 'GROUP_NOT_FOUND' : 'AMBIGUOUS_GROUP',
        details: { groupName, matchCount: matches.length },
      },
    )
  }
  return matches[0]
}

export function createOrthancDataSource({ client, groupName }) {
  async function getAssignableUsers({ signal } = {}) {
    const groups = normalizeGroups(
      await client.getGroupsByName(groupName, { signal }),
    )
    const group = selectGroup(groups, groupName)
    return normalizeUsers(
      await client.getUsersByGroup(group.id, { currentEvent: true, signal }),
    )
  }

  return {
    async getHealth({ signal } = {}) {
      return normalizeHealth(await client.getHealth({ signal }))
    },

    async getCurrentEvent({ signal } = {}) {
      return normalizeCurrentEvent(await client.getCurrentEvent({ signal }))
    },

    getAssignableUsers,

    async getFigurants({ signal } = {}) {
      const [rawFigurants, users] = await Promise.all([
        client.getActiveFigurants({ signal }),
        getAssignableUsers({ signal }),
      ])
      return normalizeFigurants(rawFigurants, users)
    },
  }
}
