'use client'

import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { Settings, ToggleLeft, ToggleRight, PenLine, Download, Trash2 } from 'lucide-react'
import { useState } from 'react'

export function SermonSettingsPanel() {
  const { t } = useTranslation()
  const { currentSermon, sermons, setSermons } = useBibleStore()
  const [autoSave, setAutoSave] = useState(true)
  const [aiPreference, setAiPreference] = useState<'formal' | 'casual' | 'scholarly'>('casual')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleExport = () => {
    if (!currentSermon) return
    let contentText = ''
    try {
      const parsed = typeof currentSermon.content === 'string' ? JSON.parse(currentSermon.content) : currentSermon.content
      contentText = parsed?.content
        ?.map((node: any) => node.content?.map((c: any) => c.text || '').join('') || '')
        .join('\n') || ''
    } catch {
      contentText = String(currentSermon.content || '')
    }

    const exportText = `# ${currentSermon.title}\n\n## ${t('sermon.verseRefsLabel')}: ${currentSermon.verseRefs || 'N/A'}\n\n${contentText}`
    const blob = new Blob([exportText], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentSermon.title || 'sermon'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!currentSermon) return
    try {
      const res = await fetch(`/api/sermon/${currentSermon.id}`, { method: 'DELETE' })
      if (res.ok) {
        setSermons(sermons.filter(s => s.id !== currentSermon.id))
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      console.error('[SermonSettings] Delete failed:', error)
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('sermon.settingsPanelTitle')}</span>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Default Style */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">{t('sermon.settingsDefaultStyle')}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(['EXPOSITORY', 'TOPICAL', 'NARRATIVE', 'FREE'] as const).map((style) => (
              <div
                key={style}
                className={`px-2 py-1.5 rounded-md text-[10px] font-medium text-center transition-colors ${
                  currentSermon?.style === style
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {t(`sermon.${style.toLowerCase()}`)}
              </div>
            ))}
          </div>
        </div>

        {/* Auto Save */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
          <button
            onClick={() => setAutoSave(!autoSave)}
            className="flex items-center justify-between w-full"
          >
            <div className="text-left">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('sermon.settingsAutoSave')}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{t('sermon.settingsAutoSaveDesc')}</p>
            </div>
            {autoSave ? (
              <ToggleRight className="w-5 h-5 text-blue-500" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* AI Preference */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <PenLine className="w-3 h-3 text-blue-500" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('sermon.settingsAiPreference')}</p>
          </div>
          <p className="text-[10px] text-slate-400 mb-2">{t('sermon.settingsAiPreferenceDesc')}</p>
          <div className="flex gap-1.5">
            {[
              { key: 'formal' as const, label: t('sermon.settingsAiFormal') },
              { key: 'casual' as const, label: t('sermon.settingsAiCasual') },
              { key: 'scholarly' as const, label: t('sermon.settingsAiScholarly') },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setAiPreference(key)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  aiPreference === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Current Sermon Info */}
        {currentSermon && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">{t('sermon.settingsInfo')}</p>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400">{t('sermon.settingsTitle')}</span>
                <span className="text-slate-700 dark:text-slate-300">{currentSermon.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('sermon.settingsWordCount')}</span>
                <span className="text-slate-700 dark:text-slate-300">{currentSermon.wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('sermon.settingsStatus')}</span>
                <span className="text-slate-700 dark:text-slate-300">{t(`sermon.${currentSermon.status.toLowerCase()}`)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('sermon.settingsCreatedAt')}</span>
                <span className="text-slate-700 dark:text-slate-300">{new Date(currentSermon.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {currentSermon && (
          <div className="space-y-2">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {t('sermon.exportSermon')}
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('sermon.deleteSermon')}
              </button>
            ) : (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-2">
                <p className="text-[10px] text-red-600 dark:text-red-400 mb-2">{t('sermon.deleteConfirm')}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-1.5 rounded-md text-[10px] font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    {t('sermon.confirmDelete')}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-1.5 rounded-md text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    {t('sermon.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}