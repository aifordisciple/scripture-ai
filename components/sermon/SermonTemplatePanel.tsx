'use client'

import { useState } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { LayoutTemplate, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Template {
  id: string
  nameKey: string
  descKey: string
  style: string
  sections: { title: string; placeholder: string }[]
}

const TEMPLATES: Template[] = [
  {
    id: 'expository',
    nameKey: 'templateExpository',
    descKey: 'templateExpositoryDesc',
    style: 'EXPOSITORY',
    sections: [
      { title: '📖 引言', placeholder: '经文背景与上下文' },
      { title: '📝 经文释义', placeholder: '逐节解释经文含义' },
      { title: '💡 核心信息', placeholder: '提炼主要属灵真理' },
      { title: '🔗 生活应用', placeholder: '如何应用到日常生活中' },
      { title: '🙏 结语', placeholder: '总结与呼召' },
    ],
  },
  {
    id: 'topical',
    nameKey: 'templateTopical',
    descKey: 'templateTopicalDesc',
    style: 'TOPICAL',
    sections: [
      { title: '📖 主题引入', placeholder: '引出今日主题' },
      { title: '📝 论点一', placeholder: '第一个分论点与经文依据' },
      { title: '📝 论点二', placeholder: '第二个分论点与经文依据' },
      { title: '📝 论点三', placeholder: '第三个分论点与经文依据' },
      { title: '🔗 生活应用', placeholder: '如何应用到日常生活中' },
      { title: '🙏 结语', placeholder: '总结与呼召' },
    ],
  },
  {
    id: 'narrative',
    nameKey: 'templateNarrative',
    descKey: 'templateNarrativeDesc',
    style: 'NARRATIVE',
    sections: [
      { title: '📖 故事背景', placeholder: '叙述故事的历史背景' },
      { title: '👥 人物分析', placeholder: '分析关键人物及其选择' },
      { title: '💡 属灵教训', placeholder: '从故事中提炼属灵真理' },
      { title: '🔗 现代意义', placeholder: '故事对今日的启示' },
      { title: '🙏 结语', placeholder: '总结与呼召' },
    ],
  },
  {
    id: 'free',
    nameKey: 'templateFree',
    descKey: 'templateFreeDesc',
    style: 'FREE',
    sections: [
      { title: '📖 开场', placeholder: '自由发挥' },
      { title: '📝 正文', placeholder: '自由发挥' },
      { title: '🙏 结语', placeholder: '自由发挥' },
    ],
  },
]

export function SermonTemplatePanel() {
  const { t } = useTranslation()
  const { currentSermon, setCurrentSermon } = useBibleStore()
  const [appliedId, setAppliedId] = useState<string | null>(null)

  const handleApply = (template: Template) => {
    if (!currentSermon) return
    const markdown = template.sections
      .map(s => `## ${s.title}\n\n${s.placeholder}`)
      .join('\n\n')
    // Replace editor content by updating currentSermon (triggers re-sync)
    setCurrentSermon({ ...currentSermon, content: markdown })
    setAppliedId(template.id)
    setTimeout(() => setAppliedId(null), 2000)
  }

  return (
    <div className="h-full flex flex-col bg-secondary">
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground/90">{t('sermon.templatePanelTitle')}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {TEMPLATES.map(template => (
          <button
            key={template.id}
            onClick={() => handleApply(template)}
            className={cn(
              'w-full text-left rounded-lg border p-2.5 transition-colors',
              appliedId === template.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground/90">{t(`sermon.${template.nameKey}`)}</span>
              {appliedId === template.id && <Check className="w-3.5 h-3.5 text-primary" />}
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{t(`sermon.${template.descKey}`)}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {template.sections.slice(0, 3).map((s, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {s.title}
                </span>
              ))}
              {template.sections.length > 3 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  +{template.sections.length - 3}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}