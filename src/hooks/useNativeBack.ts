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

    // Push a dummy state with our unique modalId when opened.
    window.history.pushState({ modalId }, '')

    const handlePopState = (e: PopStateEvent) => {
      // If the current history state is NO LONGER our modalId,
      // it means our dummy state was popped by the user pressing the hardware back button.
      if (e.state?.modalId !== modalId) {
        isClosingViaPopstate.current = true
        onCloseRef.current()
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)

      // If the modal was closed programmatically (e.g., clicking close button or backdrop)
      // and NOT by the user pressing the hardware back button, we need to revert the dummy history state.
      // We check if our state is still the active one at the top of the stack before popping.
      if (!isClosingViaPopstate.current && window.history.state?.modalId === modalId) {
        window.history.back()
      }
    }
  }, [isOpen, modalId])
}
