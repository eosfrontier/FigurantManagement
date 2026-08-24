import { createJsonClient } from './http.js'

export const DEFAULT_ORTHANC_PROXY_PATH = '/dev-api/orthanc/'

function positiveIdentifier(value, field) {
  const identifier = String(value ?? '').trim()
  if (!/^[1-9]\d*$/.test(identifier)) {
    throw new TypeError(`${field} must be a positive numeric identifier.`)
  }
  return identifier
}

export function createOrthancClient({
  baseUrl = DEFAULT_ORTHANC_PROXY_PATH,
  fetchImpl = globalThis.fetch,
} = {}) {
  const http = createJsonClient({
    baseUrl,
    service: 'orthanc',
    fetchImpl,
  })

  return {
    getHealth({ signal } = {}) {
      return http.get('health/', {
        operation: 'getHealth',
        signal,
      })
    },

    getGroupsByName(name, { signal } = {}) {
      return http.get('joomla/groups/', {
        operation: 'getGroupsByName',
        headers: { name },
        notFoundValue: [],
        signal,
      })
    },

    getUsersByGroup(groupId, { currentEvent = false, signal } = {}) {
      return http.get('joomla/users/', {
        operation: 'getUsersByGroup',
        headers: {
          group_id: String(groupId),
          current_event: currentEvent ? '1' : undefined,
        },
        notFoundValue: [],
        signal,
      })
    },

    getActiveFigurants({ signal } = {}) {
      return http.get('chars_figu/', {
        operation: 'getActiveFigurants',
        headers: { all_figurants: '1' },
        notFoundValue: [],
        signal,
      })
    },

    getCurrentEvent({ signal } = {}) {
      return http.get('event/current/', {
        operation: 'getCurrentEvent',
        notFoundValue: [],
        signal,
      })
    },

    setFigurantAssignment(
      characterId,
      assignedExternalUserId,
      { signal } = {},
    ) {
      const id = positiveIdentifier(characterId, 'characterId')
      const assignment =
        assignedExternalUserId === null
          ? 'null'
          : positiveIdentifier(
              assignedExternalUserId,
              'assignedExternalUserId',
            )

      return http.put('chars_figu/', {
        operation: 'setFigurantAssignment',
        headers: {
          id,
          figurant: JSON.stringify({ figu_accountID: assignment }),
        },
        signal,
      })
    },
  }
}
