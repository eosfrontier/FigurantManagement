import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getUserFacingError } from '../api/errors.js'

const JoomlaSessionContext = createContext(null)

export function JoomlaSessionProvider({ children, loadSession, authMode }) {
  const [state, setState] = useState({ status: 'idle' })
  const requestId = useRef(0)
  const activeController = useRef(null)

  const refresh = useCallback(async () => {
    activeController.current?.abort()
    const controller = new AbortController()
    const currentRequest = ++requestId.current
    activeController.current = controller
    setState({ status: 'loading' })

    try {
      const session = await loadSession({ signal: controller.signal })
      if (requestId.current === currentRequest) {
        setState({ status: 'ready', session })
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      console.error(error)
      if (requestId.current === currentRequest) {
        setState({ status: 'error', message: getUserFacingError(error) })
      }
    } finally {
      if (requestId.current === currentRequest) activeController.current = null
    }
  }, [loadSession])

  useEffect(() => {
    refresh()
    return () => {
      requestId.current += 1
      activeController.current?.abort()
    }
  }, [refresh])

  const value = useMemo(
    () => ({
      ...state,
      authMode,
      refresh,
      isLoggedIn: state.session?.authenticated ?? false,
      canManageFigurants: state.session?.canManageFigurants ?? false,
    }),
    [authMode, refresh, state],
  )

  return (
    <JoomlaSessionContext.Provider value={value}>
      {children}
    </JoomlaSessionContext.Provider>
  )
}

export function useJoomlaSession() {
  const context = useContext(JoomlaSessionContext)
  if (!context) {
    throw new Error('useJoomlaSession must be used within JoomlaSessionProvider.')
  }
  return context
}
