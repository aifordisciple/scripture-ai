'use client'

import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { useBreakpoint } from '@/hooks/use-media-query'
import { Settings, ToggleLeft, ToggleRight, PenLine, Download, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { VoiceProfilePanel } from './VoiceProfilePanel'
import { TheologyPanel } from './TheologyPanel'

export function SermonSettingsPanel() {
  const { t } = useTranslation()
  const { isMd } = useBreakpoint()
  const { currentSermon, sermons, setSermons, setCurrentSermon, sermonAutoSave, setSermonAutoSave, sermonAiPreference, setSermonAiPreference } = useBibleStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleExport = () => {
    if (!currentSermon) return
    // Content is now Markdown — export directly
    const content = currentSermon.content || ''
    const title = currentSermon.title || 'sermon'
    const markdown = `# ${title}\n\n${content}`
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!currentSermon) return
    try {
      const res = await fetch(`/api/sermon?id=${currentSermon.id}`, { method: 'DELETE' })
      if (res.ok) {
        setSermons(sermons.filter(s => s.id !== currentSermon.id))
        setCurrentSermon(null)
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      console.error('[SermonSettings] Delete failed:', error)
    }
  }

  return (
    <div className="h-full flex flex-col bg-secondary">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground/90">{t('sermon.settingsPanelTitle')}</span>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Default Style */}
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-semibold text-foreground/90 mb-2">{t('sermon.settingsDefaultStyle')}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(['EXPOSITORY', 'TOPICAL', 'NARRATIVE', 'FREE'] as const).map((style) => (
              <button
                key={style}
                onClick={async () => {
                  if (!currentSermon || currentSermon.style === style) return
                  const updated = { ...currentSermon, style }
                  setCurrentSermon(updated)
                  try {
                    await fetch('/api/sermon', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: currentSermon.id, style }),
                    })
                    setSermons(sermons.map(s => s.id === currentSermon.id ? updated : s))
                  } catch {}
                }}
                className={cn(
                  `${isMd ? 'px-2 py-1.5' : 'px-3 py-2.5 min-h-[44px]'} rounded-md text-[10px] font-semibold text-center transition-colors active:scale-95`,
                  currentSermon?.style === style
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                )}
              >
                {t(`sermon.${style.toLowerCase()}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Save */}
        <div className="rounded-lg border border-border bg-card p-3">
          <button
            onClick={() => setSermonAutoSave(!sermonAutoSave)}
            className="flex items-center justify-between w-full"
          >
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground/90">{t('sermon.settingsAutoSave')}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t('sermon.settingsAutoSaveDesc')}</p>
            </div>
            {sermonAutoSave ? (
              <ToggleRight className="w-5 h-5 text-primary" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* AI Preference */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <PenLine className="w-3 h-3 text-primary" />
            <p className="text-xs font-semibold text-foreground/90">{t('sermon.settingsAiPreference')}</p>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">{t('sermon.settingsAiPreferenceDesc')}</p>
          <div className="flex gap-1.5">
            {[
              { key: 'formal' as const, label: t('sermon.settingsAiFormal') },
              { key: 'casual' as const, label: t('sermon.settingsAiCasual') },
              { key: 'scholarly' as const, label: t('sermon.settingsAiScholarly') },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSermonAiPreference(key)}
                className={cn(
                  `${isMd ? 'px-2 py-1' : 'px-3 py-2 min-h-[44px]'} rounded-md text-[10px] font-semibold transition-colors active:scale-95`,
                  sermonAiPreference === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Profile */}
        <div className="rounded-lg border border-border bg-card p-2">
          <VoiceProfilePanel />
        </div>

        {/* Theology Resources */}
        <div className="rounded-lg border border-border bg-card p-2">
          <TheologyPanel />
        </div>

        {/* Current Sermon Info */}
        {currentSermon && (
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('sermon.settingsInfo')}</p>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sermon.settingsTitle')}</span>
                <span className="text-foreground/90">{currentSermon.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sermon.settingsWordCount')}</span>
                <span className="text-foreground/90">{currentSermon.wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sermon.settingsStatus')}</span>
                <span className="text-foreground/90">{t(`sermon.${currentSermon.status.toLowerCase()}`)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sermon.settingsCreatedAt')}</span>
                <span className="text-foreground/90">{new Date(currentSermon.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {currentSermon && (
          <div className="space-y-2">
            <button
              onClick={handleExport}
              className={`w-full flex items-center justify-center gap-1.5 ${isMd ? 'py-2' : 'py-3 min-h-[44px]'} rounded-lg text-xs font-semibold bg-muted text-muted-foreground hover:bg-secondary transition-colors active:scale-95`}
            >
              <Download className="w-3.5 h-3.5" />
              {t('sermon.exportSermon')}
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={`w-full flex items-center justify-center gap-1.5 ${isMd ? 'py-2' : 'py-3 min-h-[44px]'} rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors active:scale-95`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('sermon.deleteSermon')}
              </button>
            ) : (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2">
                <p className="text-[10px] text-destructive mb-2">{t('sermon.deleteConfirm')}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-1.5 rounded-md text-[10px] font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    {t('sermon.confirmDelete')}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-1.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground hover:bg-secondary transition-colors"
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