import { useCallback } from 'react'

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning'

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 50,
  medium: 100,
  heavy: 150,
  success: [50, 50, 100],
  warning: [50, 100, 50, 100],
  error: [100, 50, 100, 50, 150],
}

/**
 * Hook to trigger native haptic feedback on Android devices.
 * Fail-safes gracefully on unsupported devices (e.g. iOS Web, Desktop).
 */
export function useHaptics() {
  const vibrate = useCallback((pattern: HapticPattern = 'light') => {
    if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
      return
    }

    try {
      window.navigator.vibrate(HAPTIC_PATTERNS[pattern])
    } catch (error) {
      // Ignore errors if browser blocks vibration without user interaction
      console.warn('[Haptics] Failed to vibrate:', error)
    }
  }, [])

  return { vibrate }
}
