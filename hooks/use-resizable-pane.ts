// hooks/use-resizable-pane.ts
import { useState, useCallback, useRef, useEffect } from 'react'

interface UseResizablePaneOptions {
  /** Initial ratio of left pane (0-1), default 0.4 */
  defaultRatio?: number
  /** Minimum ratio for left pane, default 0.25 */
  minRatio?: number
  /** Maximum ratio for left pane, default 0.65 */
  maxRatio?: number
  /** Persisted ratio from store */
  persistedRatio?: number
  /** Callback when ratio changes (for store persistence) */
  onRatioChange?: (ratio: number) => void
}

interface UseResizablePaneReturn {
  /** Current ratio of left pane (0-1) */
  ratio: number
  /** Whether the user is currently dragging */
  isDragging: boolean
  /** Mouse down handler for the divider */
  onDividerMouseDown: (e: React.MouseEvent) => void
  /** Touch start handler for the divider */
  onDividerTouchStart: (e: React.TouchEvent) => void
  /** Double click handler to reset to default */
  onDividerDoubleClick: () => void
  /** Ref for the container element */
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function useResizablePane({
  defaultRatio = 0.4,
  minRatio = 0.25,
  maxRatio = 0.65,
  persistedRatio,
  onRatioChange,
}: UseResizablePaneOptions = {}): UseResizablePaneReturn {
  const [ratio, setRatio] = useState(() => persistedRatio ?? defaultRatio)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Sync with persisted ratio when it changes externally
  useEffect(() => {
    if (persistedRatio !== undefined && persistedRatio !== ratio) {
      setRatio(persistedRatio)
    }
  }, [persistedRatio])

  const clampRatio = useCallback((r: number) => {
    return Math.min(maxRatio, Math.max(minRatio, r))
  }, [minRatio, maxRatio])

  const handleDragMove = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const newRatio = clampRatio(clientX / rect.width)
    setRatio(newRatio)
    onRatioChange?.(newRatio)
  }, [clampRatio, onRatioChange])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Mouse handlers
  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const onMouseMove = (ev: MouseEvent) => {
      handleDragMove(ev.clientX)
    }

    const onMouseUp = () => {
      handleDragEnd()
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [handleDragMove, handleDragEnd])

  // Touch handlers
  const onDividerTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const onTouchMove = (ev: TouchEvent) => {
      const touch = ev.touches[0]
      if (touch) {
        handleDragMove(touch.clientX)
      }
    }

    const onTouchEnd = () => {
      handleDragEnd()
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }

    document.addEventListener('touchmove', onTouchMove)
    document.addEventListener('touchend', onTouchEnd)
  }, [handleDragMove, handleDragEnd])

  // Double click to reset
  const onDividerDoubleClick = useCallback(() => {
    setRatio(defaultRatio)
    onRatioChange?.(defaultRatio)
  }, [defaultRatio, onRatioChange])

  // Prevent text selection during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    } else {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    return () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDragging])

  return {
    ratio,
    isDragging,
    onDividerMouseDown,
    onDividerTouchStart,
    onDividerDoubleClick,
    containerRef,
  }
}
