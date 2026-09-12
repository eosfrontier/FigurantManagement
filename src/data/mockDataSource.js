import { mockApplicationData } from '../fixtures/mockData.js'
import { ContractError } from '../api/errors.js'

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
