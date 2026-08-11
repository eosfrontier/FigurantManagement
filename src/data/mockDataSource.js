import { mockApplicationData } from '../fixtures/mockData.js'

function abortError() {
  return new DOMException('The request was aborted.', 'AbortError')
}

function delayedClone(value, delayMs, signal) {
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
  return {
    getHealth({ signal } = {}) {
      return delayedClone(mockApplicationData.health, delayMs, signal)
    },
    getCurrentEvent({ signal } = {}) {
      return delayedClone(mockApplicationData.currentEvent, delayMs, signal)
    },
    getAssignableUsers({ signal } = {}) {
      return delayedClone(mockApplicationData.users, delayMs, signal)
    },
    getFigurants({ signal } = {}) {
      return delayedClone(mockApplicationData.figurants, delayMs, signal)
    },
  }
}
