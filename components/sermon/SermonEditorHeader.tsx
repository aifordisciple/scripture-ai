'use client'

import { useState, useCallback } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Calendar, Tag, BookOpen, X } from 'lucide-react'

export function SermonEditorHeader() {
  const { t } = useTranslation()
  const { currentSermon, setCurrentSermon, isSermonSaving, sermonFolders } = useBibleStore()

  if (!currentSermon) return null

  const handleTitleChange = useCallback((title: string) => {
    setCurrentSermon({ ...currentSermon, title })
  }, [currentSermon, setCurrentSermon])

  const handleStyleChange = useCallback((style: string) => {
    setCurrentSermon({ ...currentSermon, style: style as any })
  }, [currentSermon, setCurrentSermon])

  const handleDateChange = useCallback((date: string) => {
    setCurrentSermon({ ...currentSermon, sermonDate: date || null })
  }, [currentSermon, setCurrentSermon])

  const handleFolderChange = useCallback((folderId: string) => {
    setCurrentSermon({ ...currentSermon, folderId: folderId || null })
  }, [currentSermon, setCurrentSermon])

  const handleAddTag = useCallback((tag: string) => {
    if (!tag.trim() || currentSermon.tags.includes(tag.trim())) return
    setCurrentSermon({ ...currentSermon, tags: [...currentSermon.tags, tag.trim()] })
  }, [currentSermon, setCurrentSermon])

  const handleRemoveTag = useCallback((tag: string) => {
    setCurrentSermon({ ...currentSermon, tags: currentSermon.tags.filter(t => t !== tag) })
  }, [currentSermon, setCurrentSermon])

  const styleOptions = [
    { value: 'EXPOSITORY', label: t('sermon.expository') },
    { value: 'TOPICAL', label: t('sermon.topical') },
    { value: 'NARRATIVE', label: t('sermon.narrative') },
    { value: 'FREE', label: t('sermon.free') },
  ]

  const statusColor = currentSermon.status === 'DRAFT'
    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    : currentSermon.status === 'IN_PROGRESS'
    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'

  const statusLabel = currentSermon.status === 'DRAFT'
    ? t('sermon.draft')
    : currentSermon.status === 'IN_PROGRESS'
    ? t('sermon.inProgress')
    : t('sermon.completed')

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-2">
      <div className="flex items-center gap-3 flex-wrap">
        {/* 标题 */}
        <input
          type="text"
          value={currentSermon.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={t('sermon.untitled')}
          className="text-sm font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-none focus:outline-none focus:ring-0 min-w-[120px] max-w-[300px]"
        />

        {/* 风格 */}
        <select
          value={currentSermon.style}
          onChange={(e) => handleStyleChange(e.target.value)}
          className="text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {styleOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* 状态 */}
        <span className={cn('text-[10px] px-2 py-0.5 rounded', statusColor)}>
          {statusLabel}
        </span>

        {/* 日期 */}
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <input
            type="date"
            value={currentSermon.sermonDate || ''}
            onChange={(e) => handleDateChange(e.target.value)}
            className="text-[10px] text-slate-500 bg-transparent border-none focus:outline-none"
          />
        </div>

        {/* 文件夹 */}
        {sermonFolders.length > 0 && (
          <select
            value={currentSermon.folderId || ''}
            onChange={(e) => handleFolderChange(e.target.value)}
            className="text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">{t('sermon.rootFolder')}</option>
            {sermonFolders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        )}

        {/* 标签 */}
        <div className="flex items-center gap-1 flex-wrap">
          {currentSermon.tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <TagInput onAdd={handleAddTag} />
        </div>

        {/* 保存状态 */}
        <span className="ml-auto text-[10px] text-slate-400">
          {isSermonSaving ? t('sermon.saving') : t('sermon.autoSaved')}
        </span>
      </div>
    </div>
  )
}

function TagInput({ onAdd }: { onAdd: (tag: string) => void }) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-0.5"
      >
        <Tag className="w-2.5 h-2.5" />
        +
      </button>
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && value.trim()) {
          onAdd(value.trim())
          setValue('')
          setShow(false)
        }
        if (e.key === 'Escape') {
          setShow(false)
          setValue('')
        }
      }}
      onBlur={() => {
        if (value.trim()) onAdd(value.trim())
        setShow(false)
        setValue('')
      }}
      placeholder={t('sermon.addTag')}
      className="text-[10px] w-16 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
      autoFocus
    />
  )
}