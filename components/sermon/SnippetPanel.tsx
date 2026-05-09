'use client'

import React, { useState, useMemo } from 'react'
import { Clipboard, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'

/** Sermon snippet definition */
export interface SermonSnippet {
  id: string
  /** Category for grouping */
  category: 'opening' | 'transition' | 'illustration' | 'application' | 'prayer' | 'closing'
  zhTitle: string
  enTitle: string
  zhDescription: string
  enDescription: string
  /** Template content with {{placeholders}} */
  zhTemplate: string
  enTemplate: string
}

/** Built-in sermon snippets */
export const SERMON_SNIPPETS: SermonSnippet[] = [
  // Opening
  {
    id: 'opening-greeting',
    category: 'opening',
    zhTitle: '开场问候',
    enTitle: 'Opening Greeting',
    zhDescription: '温暖的问候与经文引入',
    enDescription: 'Warm greeting with Scripture introduction',
    zhTemplate: `亲爱的弟兄姊妹，平安！

今天我们要一起来看{{verseRef}}这段经文。在这段经文中，我们将看到{{mainTheme}}的真理，这对我们每一个人的生活都有着深远的影响。`,
    enTemplate: `Dear brothers and sisters, grace and peace to you!

Today we will look together at {{verseRef}}. In this passage, we will discover the truth of {{mainTheme}}, which has a profound impact on each of our lives.`,
  },
  {
    id: 'opening-hook',
    category: 'opening',
    zhTitle: '悬念开场',
    enTitle: 'Hook Opening',
    zhDescription: '以问题或故事引发思考',
    enDescription: 'Start with a question or story to provoke thought',
    zhTemplate: `你有没有想过，{{question}}？

这个问题看似简单，却触及了我们信仰的核心。让我们一起从{{verseRef}}中寻找答案。`,
    enTemplate: `Have you ever wondered, {{question}}?

This question seems simple, yet it touches the core of our faith. Let's find the answer together from {{verseRef}}.`,
  },
  // Transition
  {
    id: 'transition-bridge',
    category: 'transition',
    zhTitle: '过渡桥梁',
    enTitle: 'Bridge Transition',
    zhDescription: '从一段过渡到下一段',
    enDescription: 'Transition from one section to the next',
    zhTemplate: `\n从以上我们看到{{previousPoint}}。但这并不是结束——这个真理如何在我们日常生活中体现呢？让我们继续来看。`,
    enTemplate: `\nFrom the above we see {{previousPoint}}. But this is not the end — how does this truth manifest in our daily lives? Let's continue.`,
  },
  {
    id: 'transition-question',
    category: 'transition',
    zhTitle: '提问过渡',
    enTitle: 'Question Transition',
    zhDescription: '用提问连接段落',
    enDescription: 'Use a question to connect sections',
    zhTemplate: `\n那么，{{transitionQuestion}}？这正是我们接下来要探讨的。`,
    enTemplate: `\nSo, {{transitionQuestion}}? That's exactly what we'll explore next.`,
  },
  // Illustration
  {
    id: 'illustration-life',
    category: 'illustration',
    zhTitle: '生活例证',
    enTitle: 'Life Illustration',
    zhDescription: '日常生活中的类比',
    enDescription: 'Analogy from everyday life',
    zhTemplate: `\n想象一下{{lifeScenario}}。这就像我们{{analogy}}。圣经告诉我们{{biblicalTruth}}，而这个例证帮助我们更直观地理解。`,
    enTemplate: `\nImagine {{lifeScenario}}. This is like {{analogy}}. The Bible tells us {{biblicalTruth}}, and this illustration helps us understand more intuitively.`,
  },
  {
    id: 'illustration-story',
    category: 'illustration',
    zhTitle: '故事例证',
    enTitle: 'Story Illustration',
    zhDescription: '一个简短的见证或故事',
    enDescription: 'A brief testimony or story',
    zhTemplate: `\n有一位{{personDesc}}，他/她{{storyContent}}。这个故事让我们看到{{lesson}}。`,
    enTemplate: `\nThere was {{personDesc}} who {{storyContent}}. This story shows us {{lesson}}.`,
  },
  // Application
  {
    id: 'application-personal',
    category: 'application',
    zhTitle: '个人应用',
    enTitle: 'Personal Application',
    zhDescription: '个人层面的应用点',
    enDescription: 'Personal-level application points',
    zhTemplate: `\n**应用：**

1. {{application1}} — 今天就开始这个改变。
2. {{application2}} — 在{{context}}中实践。
3. {{application3}} — 与{{community}}分享你的经历。`,
    enTemplate: `\n**Application:**

1. {{application1}} — Start this change today.
2. {{application2}} — Practice in {{context}}.
3. {{application3}} — Share your experience with {{community}}.`,
  },
  {
    id: 'application-challenge',
    category: 'application',
    zhTitle: '挑战应用',
    enTitle: 'Challenge Application',
    zhDescription: '以挑战方式提出应用',
    enDescription: 'Present application as a challenge',
    zhTemplate: `\n我挑战你，在接下来的一周里：{{challengeContent}}。这不是一个容易的挑战，但{{encouragement}}。`,
    enTemplate: `\nI challenge you, in the coming week: {{challengeContent}}. This is not an easy challenge, but {{encouragement}}.`,
  },
  // Prayer
  {
    id: 'prayer-closing',
    category: 'prayer',
    zhTitle: '结束祷告',
    enTitle: 'Closing Prayer',
    zhDescription: '回应讲章主题的结束祷告',
    enDescription: 'Closing prayer responding to sermon theme',
    zhTemplate: `\n**祷告：**

天父，感谢你{{thanksgiving}}。求你帮助我们{{petition}}，让{{purpose}}在我们的生命中成就。奉耶稣基督的名，阿们。`,
    enTemplate: `\n**Prayer:**

Father, thank You for {{thanksgiving}}. Help us to {{petition}}, so that {{purpose}} may be accomplished in our lives. In Jesus' name, Amen.`,
  },
  {
    id: 'prayer-commitment',
    category: 'prayer',
    zhTitle: '委身祷告',
    enTitle: 'Commitment Prayer',
    zhDescription: '带领会众做出委身的祷告',
    enDescription: 'Prayer leading congregation to commitment',
    zhTemplate: `\n**委身祷告：**

主啊，我愿意{{commitment}}。求你赐我{{request}}，使我能在{{area}}中忠心地跟随你。阿们。`,
    enTemplate: `\n**Commitment Prayer:**

Lord, I am willing to {{commitment}}. Grant me {{request}}, so I can faithfully follow You in {{area}}. Amen.`,
  },
  // Closing
  {
    id: 'closing-summary',
    category: 'closing',
    zhTitle: '总结收尾',
    enTitle: 'Summary Closing',
    zhDescription: '总结讲章要点',
    enDescription: 'Summarize sermon key points',
    zhTemplate: `\n让我们回顾今天分享的三个要点：

1. {{point1}}
2. {{point2}}
3. {{point3}}

愿{{blessing}}成为我们每一天的力量和指引。`,
    enTemplate: `\nLet's review the three key points shared today:

1. {{point1}}
2. {{point2}}
3. {{point3}}

May {{blessing}} be our strength and guidance every day.`,
  },
  {
    id: 'closing-call',
    category: 'closing',
    zhTitle: '呼召收尾',
    enTitle: 'Call to Action Closing',
    zhDescription: '以行动呼召结束讲章',
    enDescription: 'End sermon with a call to action',
    zhTemplate: `\n今天，{{mainMessage}}。你愿意回应这个呼召吗？

{{callToAction}}。让我们一起，从今天开始，{{finalChallenge}}。`,
    enTemplate: `\nToday, {{mainMessage}}. Are you willing to respond to this call?

{{callToAction}}. Let's start together, from today, {{finalChallenge}}.`,
  },
]

/** Category labels */
const CATEGORY_LABELS: Record<SermonSnippet['category'], { zh: string; en: string }> = {
  opening: { zh: '开场', en: 'Opening' },
  transition: { zh: '过渡', en: 'Transition' },
  illustration: { zh: '例证', en: 'Illustration' },
  application: { zh: '应用', en: 'Application' },
  prayer: { zh: '祷告', en: 'Prayer' },
  closing: { zh: '收尾', en: 'Closing' },
}

/**
 * SnippetPanel — 快捷模板片段面板
 *
 * Features:
 * - Categorized sermon writing snippets (opening, transition, illustration, etc.)
 * - Search/filter by category or keyword
 * - Click to insert snippet template with {{placeholders}}
 * - Expandable preview
 */
export function SnippetPanel({ onInsert }: { onInsert?: (text: string) => void }) {
  const { locale } = useBibleStore()
  const isZh = locale !== 'en'
  const { t } = useTranslation()

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<SermonSnippet['category'] | 'all'>('all')

  const filteredSnippets = useMemo(() => {
    let result = SERMON_SNIPPETS
    if (selectedCategory !== 'all') {
      result = result.filter(s => s.category === selectedCategory)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.zhTitle.toLowerCase().includes(q) ||
        s.enTitle.toLowerCase().includes(q) ||
        s.zhDescription.toLowerCase().includes(q) ||
        s.enDescription.toLowerCase().includes(q)
      )
    }
    return result
  }, [selectedCategory, searchQuery])

  const handleInsert = (snippet: SermonSnippet) => {
    const template = isZh ? snippet.zhTemplate : snippet.enTemplate
    onInsert?.(template)
  }

  const categories: (SermonSnippet['category'] | 'all')[] = ['all', 'opening', 'transition', 'illustration', 'application', 'prayer', 'closing']

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <Clipboard size={12} className="text-emerald-500" />
        <span className="text-xs font-medium text-foreground">
          {isZh ? '快捷片段' : 'Snippets'}
        </span>
      </div>

      {/* Search & Filter */}
      <div className="px-3 py-2 space-y-2">
        <div className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1">
          <Search size={12} className="text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isZh ? '搜索片段...' : 'Search snippets...'}
            className="flex-1 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {cat === 'all' ? (isZh ? '全部' : 'All') : CATEGORY_LABELS[cat][isZh ? 'zh' : 'en']}
            </button>
          ))}
        </div>
      </div>

      {/* Snippet list */}
      <div className="flex-1 overflow-y-auto">
        {filteredSnippets.length === 0 && (
          <div className="px-4 py-4 text-center text-sm text-muted-foreground">
            {isZh ? '没有匹配的片段' : 'No matching snippets'}
          </div>
        )}
        {filteredSnippets.map(snippet => {
          const isExpanded = expandedId === snippet.id
          const title = isZh ? snippet.zhTitle : snippet.enTitle
          const desc = isZh ? snippet.zhDescription : snippet.enDescription
          const template = isZh ? snippet.zhTemplate : snippet.enTemplate
          const catLabel = CATEGORY_LABELS[snippet.category][isZh ? 'zh' : 'en']

          return (
            <div
              key={snippet.id}
              className="border-b border-border/50 hover:bg-accent/20 transition-colors"
            >
              <div
                className="flex items-start gap-2 px-3 py-2 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : snippet.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground truncate">
                      {title}
                    </span>
                    <span className="px-1 py-0 rounded text-[9px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      {catLabel}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {desc}
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={12} className="shrink-0 mt-0.5" /> : <ChevronDown size={12} className="shrink-0 mt-0.5" />}
              </div>

              {isExpanded && (
                <div className="px-3 pb-2 pl-5">
                  {/* Template preview */}
                  <div className="bg-muted/30 rounded p-2 text-[10px] text-foreground/80 whitespace-pre-wrap leading-relaxed mb-2">
                    {template}
                  </div>
                  {/* Insert button */}
                  <button
                    onClick={() => handleInsert(snippet)}
                    className="w-full py-1.5 rounded text-[10px] font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                  >
                    {isZh ? '插入模板' : 'Insert Template'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}