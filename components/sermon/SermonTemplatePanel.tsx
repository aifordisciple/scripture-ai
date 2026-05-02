'use client'

import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { FileText, Plus } from 'lucide-react'
import { useSermonEditor } from './SermonEditorContext'

interface TemplateSection {
  heading: string
  prompts: string[]
}

interface SermonTemplate {
  id: string
  titleKey: string
  descKey: string
  sections: Record<string, TemplateSection[]>
}

const TEMPLATES: SermonTemplate[] = [
  {
    id: 'expository',
    titleKey: 'sermon.templateExpositoryTitle',
    descKey: 'sermon.templateExpositoryDesc',
    sections: {
      zh: [
        { heading: '引言', prompts: ['经文背景介绍', '讲道主题预告'] },
        { heading: '经文解析', prompts: ['上下文分析', '关键词解释', '原文亮光'] },
        { heading: '神学应用', prompts: ['核心真理', '与福音的联系', '生活应用'] },
        { heading: '结语', prompts: ['总结要点', '呼召与回应'] },
      ],
      en: [
        { heading: 'Introduction', prompts: ['Scripture background', 'Sermon theme preview'] },
        { heading: 'Exegesis', prompts: ['Context analysis', 'Key word study', 'Original language insights'] },
        { heading: 'Theological Application', prompts: ['Core truth', 'Gospel connection', 'Life application'] },
        { heading: 'Conclusion', prompts: ['Summary points', 'Call to response'] },
      ],
    },
  },
  {
    id: 'topical',
    titleKey: 'sermon.templateTopicalTitle',
    descKey: 'sermon.templateTopicalDesc',
    sections: {
      zh: [
        { heading: '主题引入', prompts: ['主题陈述', '生活情境引入'] },
        { heading: '经文论证', prompts: ['第一处经文', '第二处经文', '第三处经文'] },
        { heading: '综合应用', prompts: ['主题总结', '实践步骤', '祷告回应'] },
      ],
      en: [
        { heading: 'Topic Introduction', prompts: ['Topic statement', 'Life scenario hook'] },
        { heading: 'Scripture Arguments', prompts: ['First scripture', 'Second scripture', 'Third scripture'] },
        { heading: 'Application', prompts: ['Topic summary', 'Practical steps', 'Prayer response'] },
      ],
    },
  },
  {
    id: 'narrative',
    titleKey: 'sermon.templateNarrativeTitle',
    descKey: 'sermon.templateNarrativeDesc',
    sections: {
      zh: [
        { heading: '故事背景', prompts: ['人物介绍', '时代背景', '情节铺垫'] },
        { heading: '故事发展', prompts: ['冲突与张力', '转折点', '神的介入'] },
        { heading: '属灵教训', prompts: ['核心信息', '今日应用', '个人反思'] },
      ],
      en: [
        { heading: 'Story Background', prompts: ['Character introduction', 'Historical context', 'Plot setup'] },
        { heading: 'Story Development', prompts: ['Conflict and tension', 'Turning point', "God's intervention"] },
        { heading: 'Spiritual Lessons', prompts: ['Core message', 'Modern application', 'Personal reflection'] },
      ],
    },
  },
]

export function SermonTemplatePanel() {
  const { t } = useTranslation()
  const { locale } = useBibleStore()
  const editor = useSermonEditor()
  const lang = locale === 'en' ? 'en' : 'zh'

  const insertTemplate = (template: SermonTemplate) => {
    if (!editor) return
    const sections = template.sections[lang]
    let html = `<h2>${template.sections[lang][0]?.heading || ''}</h2>`
    sections.forEach((section) => {
      html += `<h3>${section.heading}</h3>`
      section.prompts.forEach((prompt) => {
        html += `<p>${prompt}...</p>`
      })
    })
    editor.commands.setContent(html)
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('sermon.templatePanelTitle')}</span>
        </div>
      </div>

      {/* Templates */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => insertTemplate(template)}
            className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t(template.titleKey)}</span>
              <Plus className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <p className="text-[10px] text-slate-400">{t(template.descKey)}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {template.sections[lang].map((section, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  {section.heading}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}