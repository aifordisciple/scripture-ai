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

interface ShortcutItem {
  key: string
  description: string
  category: string
}

const SHORTCUTS: ShortcutItem[] = [
  // 导航
  { key: '/', description: '打开搜索', category: '导航' },
  { key: 'd', description: '打开数据看板', category: '导航' },
  { key: 'f', description: '切换全屏', category: '导航' },

  // AI模式
  { key: 'Alt+1', description: '切换到一般对话模式', category: 'AI模式' },
  { key: 'Alt+2', description: '切换到导师模式', category: 'AI模式' },
  { key: 'Alt+3', description: '切换到讲道模式', category: 'AI模式' },
  { key: 'Alt+4', description: '切换到学习指南模式', category: 'AI模式' },

  // AI操作 (需要选中经文后)
  { key: 'h', description: '高亮选中经文', category: 'AI操作' },
  { key: 'a', description: 'AI解读选中经文', category: 'AI操作' },
  { key: 'n', description: '为选中经文添加笔记', category: 'AI操作' },
  { key: 'c', description: '复制选中经文', category: 'AI操作' },

  // 阅读
  { key: '←', description: '上一章', category: '阅读' },
  { key: '→', description: '下一章', category: '阅读' },
  { key: 'j', description: '下一节', category: '阅读' },
  { key: 'k', description: '上一节', category: '阅读' },

  // 其他
  { key: 'Ctrl+K', description: '打开搜索', category: '其他' },
  { key: 'Esc', description: '关闭对话框/取消选择', category: '其他' },
]

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const categories = [...new Set(SHORTCUTS.map(s => s.category))]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            键盘快捷键
          </DialogTitle>
          <DialogDescription>
            按下 <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">?</kbd> 可随时打开此对话框
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 mt-4">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {SHORTCUTS.filter(s => s.category === category).map(shortcut => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono font-medium">
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
