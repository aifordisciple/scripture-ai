'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import {
  SLASH_COMMANDS,
  type SlashCommand,
} from '@/components/sermon/SlashCommandMenu'

interface UseSlashCommandsOptions {
  /** Callback when a command is selected — optional, use selectCommand return value instead */
  onSelectCommand?: (command: SlashCommand) => void
}

interface UseSlashCommandsReturn {
  /** Whether the slash command menu is visible */
  visible: boolean
  /** Current filter text (typed after /) */
  filter: string
  /** Index of the currently selected command */
  selectedIndex: number
  /** Filtered list of commands matching the current filter */
  commands: SlashCommand[]
  /** Handle keydown events for navigation (up/down/enter/escape) */
  handleKeyDown: (e: KeyboardEvent) => boolean
  /** Handle text input to detect "/" and build filter */
  handleInput: (text: string, cursorPosition: number) => void
  /** Programmatically select a command */
  selectCommand: (command: SlashCommand) => void
  /** Close the menu */
  close: () => void
  /** Position for the menu (relative to editor) */
  menuPosition: { x: number; y: number }
}

/**
 * Hook for managing slash command state in the sermon editor.
 *
 * Detects "/" input, maintains filter text and menu visibility,
 * and handles keyboard navigation (up/down/enter/escape).
 */
export function useSlashCommands(options: UseSlashCommandsOptions = {}): UseSlashCommandsReturn {
  const { onSelectCommand } = options
  const { locale } = useBibleStore()

  const [visible, setVisible] = useState(false)
  const [filter, setFilter] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  // Track slash position in text to extract filter
  const slashOffsetRef = useRef<number | null>(null)

  /** Filter commands based on current filter text */
  const commands = useMemo(() => {
    if (!filter) return SLASH_COMMANDS
    const lowerFilter = filter.toLowerCase()
    return SLASH_COMMANDS.filter((cmd) => {
      const label = locale === 'en' ? cmd.labelEn : cmd.labelZh
      const desc = locale === 'en' ? cmd.descEn : cmd.descZh
      return (
        cmd.key.toLowerCase().includes(lowerFilter) ||
        label.toLowerCase().includes(lowerFilter) ||
        desc.toLowerCase().includes(lowerFilter)
      )
    })
  }, [filter, locale])

  /** Close the menu and reset state */
  const close = useCallback(() => {
    setVisible(false)
    setFilter('')
    setSelectedIndex(0)
    slashOffsetRef.current = null
  }, [])

  /** Select a command and close the menu */
  const selectCommand = useCallback((command: SlashCommand) => {
    onSelectCommand(command)
    close()
  }, [onSelectCommand, close])

  /** Handle text input to detect "/" and build filter */
  const handleInput = useCallback((text: string, cursorPosition: number) => {
    // Check if the character just typed before cursor is "/"
    const charBeforeCursor = text[cursorPosition - 1]

    if (charBeforeCursor === '/' && !visible) {
      // Check that the "/" is at the start of a line or after whitespace
      const charBeforeSlash = cursorPosition >= 2 ? text[cursorPosition - 2] : ''
      if (charBeforeSlash === '' || charBeforeSlash === '\n' || charBeforeSlash === ' ') {
        // Open the menu
        slashOffsetRef.current = cursorPosition - 1
        setVisible(true)
        setFilter('')
        setSelectedIndex(0)
        return
      }
    }

    if (visible && slashOffsetRef.current !== null) {
      // Extract filter text between "/" and cursor
      const slashPos = slashOffsetRef.current
      const filterText = text.slice(slashPos + 1, cursorPosition)

      // If the slash was deleted or cursor moved before it, close
      if (cursorPosition <= slashPos || text[slashPos] !== '/') {
        close()
        return
      }

      // If a space or newline was typed after the slash command, close
      if (filterText.includes(' ') || filterText.includes('\n')) {
        close()
        return
      }

      setFilter(filterText)
      setSelectedIndex(0)
    }
  }, [visible, close])

  /** Handle keydown events for menu navigation */
  const handleKeyDown = useCallback((e: KeyboardEvent): boolean => {
    if (!visible) return false

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < commands.length - 1 ? prev + 1 : 0
        )
        return true
      }
      case 'ArrowUp': {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : commands.length - 1
        )
        return true
      }
      case 'Enter': {
        e.preventDefault()
        if (commands[selectedIndex]) {
          selectCommand(commands[selectedIndex])
        }
        return true
      }
      case 'Escape': {
        e.preventDefault()
        close()
        return true
      }
      case 'Tab': {
        // Tab also accepts (like ghost text)
        if (commands[selectedIndex]) {
          e.preventDefault()
          selectCommand(commands[selectedIndex])
          return true
        }
        return false
      }
      default:
        return false
    }
  }, [visible, commands, selectedIndex, selectCommand, close])

  return {
    visible,
    filter,
    selectedIndex,
    commands,
    handleKeyDown,
    handleInput,
    selectCommand,
    close,
    menuPosition,
  }
}
