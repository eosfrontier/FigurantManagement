import { createJsonClient } from './http.js'

export const DEFAULT_ORTHANC_PROXY_PATH = '/dev-api/orthanc/'

function positiveIdentifier(value, field) {
  const identifier = String(value ?? '').trim()
  if (!/^[1-9]\d*$/.test(identifier)) {
    throw new TypeError(`${field} must be a positive numeric identifier.`)
  }
  return identifier
}

function cardIdentifier(value) {
  const identifier = String(value ?? '').trim()
  if (
    identifier.length === 0 ||
    identifier.length > 64 ||
    !/^[A-Za-z0-9:-]+$/.test(identifier)
  ) {
    throw new TypeError(
      'cardId must contain 1 to 64 letters, numbers, colons, or hyphens.',
    )
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

    getCharacterByIccNumber(iccNumber, { signal } = {}) {
      return http.get('chars_all/', {
        operation: 'getCharacterByIccNumber',
        headers: {
          all_statuses: '1',
          icc_number: String(iccNumber).trim(),
        },
        notFoundValue: null,
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

    setFigurantCard(characterId, cardId, { signal } = {}) {
      const id = positiveIdentifier(characterId, 'characterId')
      const normalizedCardId = cardIdentifier(cardId)

      return http.put('chars_figu/', {
        operation: 'setFigurantCard',
        headers: {
          id,
          figurant: JSON.stringify({ card_id: normalizedCardId }),
        },
        signal,
      })
    },

    updateFigurantDetails(characterId, figurant, { signal } = {}) {
      const id = positiveIdentifier(characterId, 'characterId')
      if (!figurant || typeof figurant !== 'object' || Array.isArray(figurant)) {
        throw new TypeError('figurant must be an object.')
      }
      if ('card_id' in figurant || 'figu_accountID' in figurant) {
        throw new TypeError(
          'Character-detail updates must not include card or assignment fields.',
        )
      }

      return http.put('chars_figu/', {
        operation: 'updateFigurantDetails',
        headers: {
          id,
          figurant: JSON.stringify(figurant),
        },
        signal,
      })
    },

    createPreparedFigurant(figurant, { signal } = {}) {
      if (!figurant || typeof figurant !== 'object' || Array.isArray(figurant)) {
        throw new TypeError('figurant must be an object.')
      }
      if (figurant.card_id !== null || figurant.figu_accountID !== null) {
        throw new TypeError(
          'A prepared figurant must not have a card or assigned account.',
        )
      }

      return http.post('chars_figu/', {
        operation: 'createPreparedFigurant',
        headers: { figurant: JSON.stringify(figurant) },
        signal,
      })
    },

    softDeleteFigurant(characterId, { signal } = {}) {
      const id = positiveIdentifier(characterId, 'characterId')
      return http.delete('chars_figu/', {
        operation: 'softDeleteFigurant',
        headers: { id },
        signal,
      })
    },
  }
}
