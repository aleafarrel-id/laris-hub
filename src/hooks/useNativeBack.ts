import { useEffect, useId, useRef } from 'react'

/**
 * Hook to handle Android hardware back button for modals and drawers.
 * Pushes a dummy state to the history stack when opened,
 * and intercepts the popstate event to trigger onClose instead of navigating back.
 */
export function useNativeBack(isOpen: boolean, onClose: () => void) {
  const isClosingViaPopstate = useRef(false)
  const onCloseRef = useRef(onClose)

  // Generate a unique ID for this specific modal instance
  const modalId = useId()

  // Always keep the ref updated to avoid stale closures,
  // while preventing the effect below from re-running if onClose is not memoized by the parent.
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) {
      isClosingViaPopstate.current = false
      return
    }

    let hasPushedState = false
    const timeout = setTimeout(() => {
      window.history.pushState({ modalId }, '')
      hasPushedState = true
    }, 10)

    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.modalId !== modalId) {
        isClosingViaPopstate.current = true
        onCloseRef.current()
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('popstate', handlePopState)

      if (hasPushedState && !isClosingViaPopstate.current && window.history.state?.modalId === modalId) {
        window.history.back()
      }
    }
  }, [isOpen, modalId])
}
