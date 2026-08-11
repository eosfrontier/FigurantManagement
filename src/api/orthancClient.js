import { createJsonClient } from './http.js'

export const DEFAULT_ORTHANC_PROXY_PATH = '/dev-api/orthanc/'

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
  }
}
