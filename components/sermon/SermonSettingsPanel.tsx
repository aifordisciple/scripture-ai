'use client'

import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { Settings, ToggleLeft, ToggleRight, PenLine } from 'lucide-react'

export function SermonSettingsPanel() {
  const { t } = useTranslation()
  const { currentSermon } = useBibleStore()

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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('sermon.settingsAutoSave')}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{t('sermon.settingsAutoSaveDesc')}</p>
            </div>
            <ToggleRight className="w-5 h-5 text-blue-500" />
          </div>
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
              { key: 'formal', label: t('sermon.settingsAiFormal') },
              { key: 'casual', label: t('sermon.settingsAiCasual') },
              { key: 'scholarly', label: t('sermon.settingsAiScholarly') },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Current Sermon Info */}
        {currentSermon && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">讲章信息</p>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400">标题</span>
                <span className="text-slate-700 dark:text-slate-300">{currentSermon.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">字数</span>
                <span className="text-slate-700 dark:text-slate-300">{currentSermon.wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">状态</span>
                <span className="text-slate-700 dark:text-slate-300">{t(`sermon.${currentSermon.status.toLowerCase()}`)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">创建时间</span>
                <span className="text-slate-700 dark:text-slate-300">{new Date(currentSermon.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}