'use client'

import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { useSermonEditor } from './SermonEditorContext'
import { SERMON_TEMPLATES } from '@/lib/sermon-templates'
import { LayoutTemplate, BookOpen, Lightbulb, BookMarked } from 'lucide-react'

export function SermonTemplatePanel() {
  const { t } = useTranslation()
  const { currentSermon, setCurrentSermon } = useBibleStore()
  const editor = useSermonEditor()

  const templates = [
    { key: 'EXPOSITORY', icon: BookOpen, label: t('sermon.templateExpository'), desc: t('sermon.templateExpositoryDesc'), style: 'EXPOSITORY' as const },
    { key: 'TOPICAL', icon: Lightbulb, label: t('sermon.templateTopical'), desc: t('sermon.templateTopicalDesc'), style: 'TOPICAL' as const },
    { key: 'NARRATIVE', icon: BookMarked, label: t('sermon.templateNarrative'), desc: t('sermon.templateNarrativeDesc'), style: 'NARRATIVE' as const },
  ]

  const handleApplyTemplate = (key: string, style: 'EXPOSITORY' | 'TOPICAL' | 'NARRATIVE') => {
    if (!editor || !currentSermon) return
    if (!confirm(t('sermon.templateApplyConfirm'))) return

    const templateJson = SERMON_TEMPLATES[key]
    if (!templateJson) return

    const parsed = JSON.parse(templateJson)
    editor.commands.setContent(parsed)
    setCurrentSermon({ ...currentSermon, content: templateJson, style })
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <LayoutTemplate className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('sermon.templatePanelTitle')}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{t('sermon.templatePreset')}</p>
        {templates.map(({ key, icon: Icon, label, desc, style }) => (
          <div key={key} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <div className="flex items-start gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
            <button
              onClick={() => handleApplyTemplate(key, style)}
              disabled={!editor || !currentSermon}
              className="w-full py-1.5 rounded-md text-[10px] font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 transition-colors"
            >
              {t('sermon.templateApply')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
