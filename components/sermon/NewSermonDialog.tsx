'use client'

import { useState } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { X, BookOpen, Lightbulb } from 'lucide-react'
import { SERMON_TEMPLATES } from '@/lib/sermon-templates'

interface NewSermonDialogProps {
  onClose: () => void
}

export function NewSermonDialog({ onClose }: NewSermonDialogProps) {
  const { t } = useTranslation()
  const { setCurrentSermon, setSermons, sermons, sermonFolders } = useBibleStore()

  const [title, setTitle] = useState('')
  const [style, setStyle] = useState<'EXPOSITORY' | 'TOPICAL' | 'NARRATIVE' | 'FREE'>('FREE')
  const [folderId, setFolderId] = useState<string | null>(null)

  const styleOptions = [
    { value: 'EXPOSITORY', label: t('sermon.expository'), desc: t('sermon.templateExpositoryDesc') },
    { value: 'TOPICAL', label: t('sermon.topical'), desc: t('sermon.templateTopicalDesc') },
    { value: 'NARRATIVE', label: t('sermon.narrative'), desc: t('sermon.templateNarrativeDesc') },
    { value: 'FREE', label: t('sermon.free'), desc: '' },
  ]

  const handleCreate = async () => {
    const content = style === 'FREE' ? '{}' : (SERMON_TEMPLATES[style] || '{}')

    try {
      const res = await fetch('/api/sermon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || t('sermon.untitled'),
          content,
          style,
          folderId,
          status: 'DRAFT',
        }),
      })
      const data = await res.json()
      const newSermon = data.data

      setSermons([newSermon, ...sermons])
      setCurrentSermon(newSermon)
      onClose()
    } catch {
      // 静默处理
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-[420px] max-w-[90vw] p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{t('sermon.newSermon')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 标题 */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('sermon.sermonTitle')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('sermon.untitled')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 风格选择 */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('sermon.sermonStyle')}</label>
          <div className="grid grid-cols-2 gap-2">
            {styleOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStyle(opt.value as any)}
                className={cn(
                  'flex items-start gap-2 p-3 rounded-lg border text-left transition-colors',
                  style === opt.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded flex items-center justify-center shrink-0',
                  style === opt.value ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                )}>
                  {opt.value === 'EXPOSITORY' ? <BookOpen className="w-3 h-3" /> :
                   opt.value === 'TOPICAL' ? <Lightbulb className="w-3 h-3" /> :
                   opt.value === 'NARRATIVE' ? <BookOpen className="w-3 h-3" /> :
                   <span className="text-[10px] font-bold">F</span>}
                </div>
                <div>
                  <span className={cn('text-xs font-medium', style === opt.value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300')}>
                    {opt.label}
                  </span>
                  {opt.desc && <span className="block text-[10px] text-slate-400 mt-0.5">{opt.desc}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 文件夹选择 */}
        {sermonFolders.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">文件夹</label>
            <select
              value={folderId || ''}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">根目录</option>
              {sermonFolders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 创建按钮 */}
        <button
          onClick={handleCreate}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          {t('sermon.newSermon')}
        </button>
      </div>
    </div>
  )
}