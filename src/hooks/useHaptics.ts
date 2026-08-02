import { useCallback } from 'react'

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning'

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 30,
  heavy: 50,
  success: [30, 50, 30],
  warning: [30, 50, 30, 50],
  error: [50, 50, 50, 50, 50],
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
