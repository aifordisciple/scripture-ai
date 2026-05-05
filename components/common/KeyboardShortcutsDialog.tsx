"use client"

import { useState } from 'react'
import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useTranslation } from '@/lib/i18n'

interface ShortcutItem {
  key: string
  descriptionKey: string
  categoryKey: string
}

const SHORTCUTS: ShortcutItem[] = [
  // 导航
  { key: '/', descriptionKey: 'shortcuts.openSearch', categoryKey: 'shortcuts.navCategory' },
  { key: 'd', descriptionKey: 'shortcuts.openDashboard', categoryKey: 'shortcuts.navCategory' },
  { key: 'f', descriptionKey: 'shortcuts.toggleFullscreen', categoryKey: 'shortcuts.navCategory' },

  // AI模式
  { key: 'Alt+1', descriptionKey: 'shortcuts.switchToChat', categoryKey: 'shortcuts.aiModeCategory' },
  { key: 'Alt+2', descriptionKey: 'shortcuts.switchToMentor', categoryKey: 'shortcuts.aiModeCategory' },
  { key: 'Alt+3', descriptionKey: 'shortcuts.switchToSermon', categoryKey: 'shortcuts.aiModeCategory' },
  { key: 'Alt+4', descriptionKey: 'shortcuts.switchToStudyGuide', categoryKey: 'shortcuts.aiModeCategory' },

  // AI操作 (需要选中经文后)
  { key: 'h', descriptionKey: 'shortcuts.highlightVerse', categoryKey: 'shortcuts.aiActionCategory' },
  { key: 'a', descriptionKey: 'shortcuts.aiInterpretVerse', categoryKey: 'shortcuts.aiActionCategory' },
  { key: 'n', descriptionKey: 'shortcuts.addNoteToVerse', categoryKey: 'shortcuts.aiActionCategory' },
  { key: 'c', descriptionKey: 'shortcuts.copyVerse', categoryKey: 'shortcuts.aiActionCategory' },

  // 阅读
  { key: '←', descriptionKey: 'shortcuts.prevChapter', categoryKey: 'shortcuts.readingCategory' },
  { key: '→', descriptionKey: 'shortcuts.nextChapter', categoryKey: 'shortcuts.readingCategory' },
  { key: 'j', descriptionKey: 'shortcuts.nextVerse', categoryKey: 'shortcuts.readingCategory' },
  { key: 'k', descriptionKey: 'shortcuts.prevVerse', categoryKey: 'shortcuts.readingCategory' },

  // 其他
  { key: 'Ctrl+K', descriptionKey: 'shortcuts.openSearchCtrl', categoryKey: 'shortcuts.otherCategory' },
  { key: 'Esc', descriptionKey: 'shortcuts.closeDialog', categoryKey: 'shortcuts.otherCategory' },
]

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const { t } = useTranslation()
  const categories = [...new Set(SHORTCUTS.map(s => s.categoryKey))]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            {t('shortcuts.title')}
          </DialogTitle>
          <DialogDescription>
            {t('shortcuts.description', { key: '?' })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 mt-4">
          {categories.map(categoryKey => (
            <div key={categoryKey}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {t(categoryKey)}
              </h3>
              <div className="space-y-2">
                {SHORTCUTS.filter(s => s.categoryKey === categoryKey).map(shortcut => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50"
                  >
                    <span className="text-sm">{t(shortcut.descriptionKey)}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono font-semibold">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
