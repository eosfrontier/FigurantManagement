import { mockApplicationData } from '../fixtures/mockData.js'
import { ContractError } from '../api/errors.js'
import {
  normalizePreparedFigurantDraft,
  preparedDraftToFigurant,
} from '../domain/figurantDraft.js'

function abortError() {
  return new DOMException('The request was aborted.', 'AbortError')
}

export function delayedClone(value, delayMs, signal) {
  if (signal?.aborted) return Promise.reject(abortError())

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve(structuredClone(value))
    }, delayMs)

    function onAbort() {
      clearTimeout(timeoutId)
      reject(abortError())
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export function createMockDataSource({ delayMs = 150 } = {}) {
  const figurants = structuredClone(mockApplicationData.figurants)
  const users = structuredClone(mockApplicationData.users)

  return {
    getHealth({ signal } = {}) {
      return delayedClone(mockApplicationData.health, delayMs, signal)
    },
    getCurrentEvent({ signal } = {}) {
      return delayedClone(mockApplicationData.currentEvent, delayMs, signal)
    },
    getCurrentInGameDate({ signal } = {}) {
      return delayedClone(
        {
          year: 240,
          month: 12,
          day: 27,
          yearPrefix: '',
          yearSuffix: 'NT',
        },
        delayMs,
        signal,
      )
    },
    getAssignableUsers({ signal } = {}) {
      return delayedClone(users, delayMs, signal)
    },
    getFigurants({ signal } = {}) {
      return delayedClone(
        { ...figurants, assignableUsers: users },
        delayMs,
        signal,
      )
    },
    async isIccNumberAvailable(iccNumber, { signal } = {}) {
      await delayedClone(null, delayMs, signal)
      const normalized = String(iccNumber).trim()
      return !figurants.items.some((item) => item.iccNumber === normalized)
    },
    async createPreparedFigurant(draft, { signal } = {}) {
      await delayedClone(null, delayMs, signal)
      const normalized = normalizePreparedFigurantDraft(draft)
      if (
        figurants.items.some(
          (item) => item.iccNumber === normalized.iccNumber,
        )
      ) {
        throw new ContractError('The mock ICC number already exists.', {
          code: 'MOCK_ICC_NUMBER_EXISTS',
        })
      }

      const characterId = String(
        Math.max(...figurants.items.map((item) => Number(item.characterId))) + 1,
      )
      const figurant = preparedDraftToFigurant(normalized, characterId)
      figurants.items.push(figurant)
      figurants.sourceCount += 1

      return delayedClone({ characterId, figurant }, 0, signal)
    },
    async updateFigurantDetails(
      { characterId, details },
      { signal } = {},
    ) {
      await delayedClone(null, delayMs, signal)
      const figurant = figurants.items.find(
        (item) => item.characterId === String(characterId),
      )
      if (!figurant) {
        throw new ContractError('The mock figurant does not exist.', {
          code: 'MOCK_FIGURANT_NOT_FOUND',
        })
      }

      const normalized = normalizePreparedFigurantDraft(details)
      const duplicate = figurants.items.some(
        (item) =>
          item.characterId !== figurant.characterId &&
          item.iccNumber === normalized.iccNumber,
      )
      if (duplicate) {
        throw new ContractError('The mock ICC number already exists.', {
          code: 'MOCK_ICC_NUMBER_EXISTS',
        })
      }

      Object.assign(figurant, normalized, {
        status: normalized.recurring ? 'figurant-recurring' : 'figurant',
      })
      return delayedClone(
        {
          characterId: figurant.characterId,
          details: normalized,
          affectedRows: 1,
        },
        0,
        signal,
      )
    },
    async softDeleteFigurant(characterId, { signal } = {}) {
      await delayedClone(null, delayMs, signal)
      const index = figurants.items.findIndex(
        (item) => item.characterId === String(characterId),
      )
      if (index < 0) {
        return delayedClone(
          {
            characterId: String(characterId),
            deletedCount: 0,
            message: 'The character was already absent from the active roster.',
            alreadyDeleted: true,
          },
          0,
          signal,
        )
      }

      figurants.items.splice(index, 1)
      figurants.sourceCount = Math.max(0, figurants.sourceCount - 1)
      return delayedClone(
        {
          characterId: String(characterId),
          deletedCount: 1,
          message: '1 figuranten deleted.',
          alreadyDeleted: false,
        },
        0,
        signal,
      )
    },
    async setFigurantAssignment(
      { characterId, assignedExternalUserId },
      { signal } = {},
    ) {
      await delayedClone(null, delayMs, signal)
      const figurant = figurants.items.find(
        (item) => item.characterId === String(characterId),
      )
      if (!figurant) {
        throw new ContractError('The mock figurant does not exist.', {
          code: 'MOCK_FIGURANT_NOT_FOUND',
        })
      }

      const user =
        assignedExternalUserId === null
          ? null
          : users.find(
              (item) =>
                item.externalUserId === String(assignedExternalUserId),
            )
      if (assignedExternalUserId !== null && !user) {
        throw new ContractError('The mock assignable user does not exist.', {
          code: 'MOCK_USER_NOT_FOUND',
        })
      }

      const normalizedUserId = user?.externalUserId ?? null
      const affectedRows =
        figurant.assignedExternalUserId === normalizedUserId ? 0 : 1
      figurant.assignedExternalUserId = normalizedUserId
      figurant.assignedDisplayName = user?.displayName ?? null

      return delayedClone(
        {
          characterId: figurant.characterId,
          assignedExternalUserId: normalizedUserId,
          affectedRows,
        },
        0,
        signal,
      )
    },
    async setFigurantCard({ characterId, cardId }, { signal } = {}) {
      await delayedClone(null, delayMs, signal)
      const figurant = figurants.items.find(
        (item) => item.characterId === String(characterId),
      )
      if (!figurant) {
        throw new ContractError('The mock figurant does not exist.', {
          code: 'MOCK_FIGURANT_NOT_FOUND',
        })
      }

      const normalizedCardId = String(cardId ?? '').trim()
      if (!normalizedCardId) {
        throw new ContractError('The mock card ID is empty.', {
          code: 'MOCK_CARD_ID_EMPTY',
        })
      }

      const previousHolder = figurants.items.find(
        (item) =>
          item.characterId !== figurant.characterId &&
          item.cardId === normalizedCardId,
      )
      if (previousHolder) previousHolder.cardId = null

      const affectedRows = figurant.cardId === normalizedCardId ? 0 : 1
      figurant.cardId = normalizedCardId

      return delayedClone(
        {
          characterId: figurant.characterId,
          cardId: normalizedCardId,
          affectedRows: affectedRows + (previousHolder ? 1 : 0),
        },
        0,
        signal,
      )
    },
  }
}
