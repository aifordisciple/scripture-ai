import { useRef, useCallback } from 'react'

const LONG_PRESS_DURATION = 500 // ms

/**
 * Hook for long-press gesture detection on touch devices.
 * Provides touch handlers and onContextMenu for desktop right-click.
 *
 * @param onLongPress - Callback fired after long-press threshold
 * @param threshold - Duration in ms to trigger long-press (default 500ms)
 */
export function useLongPress(
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void,
  { threshold = LONG_PRESS_DURATION } = {}
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    timerRef.current = setTimeout(() => {
      onLongPress(e)
      timerRef.current = null
    }, threshold)
  }, [onLongPress, threshold])

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return {
    onTouchStart: useCallback((e: React.TouchEvent) => start(e), [start]),
    onTouchEnd: useCallback(() => clear(), [clear]),
    onTouchMove: useCallback(() => clear(), [clear]),
    onContextMenu: useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      onLongPress(e)
    }, [onLongPress]),
  }
}