/**
 * 讲章流程引导逻辑
 * 定义讲章生命周期阶段、阶段判断、建议生成
 */

/** 讲章流程阶段 */
export type SermonFlowStage =
  | 'verse-study'    // 经文研读
  | 'outline'        // 大纲构建
  | 'draft'          // 初稿撰写
  | 'refine'         // 内容精修
  | 'review'         // 审查完善

/** 阶段信息 */
export interface FlowStageInfo {
  stage: SermonFlowStage
  labelZh: string
  labelEn: string
  descriptionZh: string
  descriptionEn: string
  progress: number // 0-100
}

/** 阶段建议 */
export interface FlowSuggestion {
  id: string
  stage: SermonFlowStage
  labelZh: string
  labelEn: string
  action: string // slash command action key
  icon?: string
}

/** 所有阶段定义 */
export const FLOW_STAGES: FlowStageInfo[] = [
  {
    stage: 'verse-study',
    labelZh: '经文研读',
    labelEn: 'Scripture Study',
    descriptionZh: '研读经文背景、原文含义和神学主题',
    descriptionEn: 'Study the background, original language, and theological themes',
    progress: 0,
  },
  {
    stage: 'outline',
    labelZh: '大纲构建',
    labelEn: 'Outline',
    descriptionZh: '构建讲章大纲，确定主要论点',
    descriptionEn: 'Build the sermon outline and determine main points',
    progress: 25,
  },
  {
    stage: 'draft',
    labelZh: '初稿撰写',
    labelEn: 'First Draft',
    descriptionZh: '撰写讲章初稿，充实每个论点',
    descriptionEn: 'Write the first draft, fleshing out each point',
    progress: 50,
  },
  {
    stage: 'refine',
    labelZh: '内容精修',
    labelEn: 'Refinement',
    descriptionZh: '润色表达、补充例证、完善应用',
    descriptionEn: 'Polish expression, add illustrations, refine applications',
    progress: 75,
  },
  {
    stage: 'review',
    labelZh: '审查完善',
    labelEn: 'Review',
    descriptionZh: 'AI审查讲章质量，根据建议完善',
    descriptionEn: 'AI review sermon quality, improve based on suggestions',
    progress: 90,
  },
]

/** 阶段建议映射 */
export const FLOW_SUGGESTIONS: FlowSuggestion[] = [
  // 经文研读阶段
  { id: 'vs-1', stage: 'verse-study', labelZh: '分析经文背景', labelEn: 'Analyze context', action: 'crossref' },
  { id: 'vs-2', stage: 'verse-study', labelZh: '原文词义研究', labelEn: 'Word study', action: 'insert-verse' },
  { id: 'vs-3', stage: 'verse-study', labelZh: '生成讲章大纲', labelEn: 'Generate outline', action: 'continue' },
  // 大纲构建阶段
  { id: 'ol-1', stage: 'outline', labelZh: '完善引言', labelEn: 'Refine intro', action: 'continue' },
  { id: 'ol-2', stage: 'outline', labelZh: '补充论点', labelEn: 'Add points', action: 'continue' },
  { id: 'ol-3', stage: 'outline', labelZh: '添加结论', labelEn: 'Add conclusion', action: 'continue' },
  // 初稿撰写阶段
  { id: 'dr-1', stage: 'draft', labelZh: '续写当前段落', labelEn: 'Continue writing', action: 'continue' },
  { id: 'dr-2', stage: 'draft', labelZh: '插入经文引用', labelEn: 'Insert verse', action: 'insert-verse' },
  { id: 'dr-3', stage: 'draft', labelZh: '添加例证', labelEn: 'Add illustration', action: 'add-example' },
  // 内容精修阶段
  { id: 'rf-1', stage: 'refine', labelZh: '润色选中段落', labelEn: 'Polish selection', action: 'polish' },
  { id: 'rf-2', stage: 'refine', labelZh: '补充应用点', labelEn: 'Add application', action: 'add-example' },
  { id: 'rf-3', stage: 'refine', labelZh: '交叉引用检查', labelEn: 'Cross-reference', action: 'crossref' },
  // 审查完善阶段
  { id: 'rv-1', stage: 'review', labelZh: '生成审查报告', labelEn: 'Generate review', action: 'review' },
  { id: 'rv-2', stage: 'review', labelZh: '根据建议修改', labelEn: 'Apply suggestions', action: 'polish' },
]

/**
 * 根据讲章内容判断当前阶段
 */
export function detectFlowStage(content: string, wordCount: number): SermonFlowStage {
  if (!content || content.trim().length < 10) {
    return 'verse-study'
  }

  const hasIntroduction = /##\s*[🎯✨💡].*引言|^#\s+.*引言/m.test(content)
  const hasMainPoint = /##\s*[💡📌].*要点|^#\s+.*要点/m.test(content)
  const hasConclusion = /##\s*[✅🎯].*结论|^#\s+.*结论/m.test(content)
  const hasOutlineStructure = hasIntroduction && hasMainPoint

  // 有完整大纲结构 → 至少在初稿阶段
  if (hasOutlineStructure && hasConclusion && wordCount >= 500) {
    return wordCount >= 1500 ? 'review' : 'refine'
  }

  // 有部分大纲 → 初稿阶段
  if (hasOutlineStructure && wordCount >= 200) {
    return 'draft'
  }

  // 有标题或大纲结构 → 大纲构建
  if (hasIntroduction || hasMainPoint || /^##\s/m.test(content)) {
    return 'outline'
  }

  // 有内容但无结构 → 根据字数判断
  if (wordCount >= 500) {
    return 'draft'
  }

  return 'verse-study'
}

/**
 * 获取指定阶段的建议列表
 */
export function getStageSuggestions(stage: SermonFlowStage): FlowSuggestion[] {
  return FLOW_SUGGESTIONS.filter(s => s.stage === stage)
}

/**
 * 获取阶段信息
 */
export function getStageInfo(stage: SermonFlowStage): FlowStageInfo {
  return FLOW_STAGES.find(s => s.stage === stage) || FLOW_STAGES[0]
}

/**
 * 获取下一个阶段
 */
export function getNextStage(stage: SermonFlowStage): SermonFlowStage | null {
  const idx = FLOW_STAGES.findIndex(s => s.stage === stage)
  if (idx < 0 || idx >= FLOW_STAGES.length - 1) return null
  return FLOW_STAGES[idx + 1].stage
}

/**
 * [P2.3] 分析讲章语调指标
 * 基于内容特征计算5个维度的语调指标
 */
export function analyzeTone(content: string): {
  formality: number
  emotion: number
  doctrinalDensity: number
  readability: number
  engagement: number
} {
  if (!content || content.trim().length < 20) {
    return { formality: 50, emotion: 50, doctrinalDensity: 30, readability: 70, engagement: 60 }
  }

  const text = content.replace(/[#*_\[\]()]/g, '') // strip markdown syntax

  // Formality: based on sentence length, use of formal markers
  const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLen = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
    : 0
  const formalMarkers = (text.match(/因此|所以|然而|并且|从而|由此可见|综上所述/g) || []).length
  const casualMarkers = (text.match(/吧|啊|呢|哦|呀|哈|嘿/g) || []).length
  const formality = Math.min(100, Math.max(0,
    40 + (avgSentenceLen > 30 ? 15 : avgSentenceLen > 20 ? 5 : -10)
    + formalMarkers * 3 - casualMarkers * 2
  ))

  // Emotion: based on emotional words and exclamation marks
  const emotionWords = (text.match(/爱|恩|苦|痛|喜|乐|哭|笑|感动|震撼|温暖|安慰|盼望|信靠|赞美|感谢|哈利路亚/g) || []).length
  const exclamations = (text.match(/[！!]{2,}/g) || []).length
  const emotion = Math.min(100, Math.max(0,
    30 + emotionWords * 2 + exclamations * 5
  ))

  // Doctrinal density: based on theological terms
  const doctrineTerms = (text.match(/称义|成圣|救赎|预知|拣选|恩典|信心|悔改|重生|三位一体|道成肉身|十字架|复活|升天|再来|圣灵|圣父|圣子|创造|启示|圣约|律法|福音/g) || []).length
  const totalWords = text.length / 2 // rough Chinese word count
  const doctrinalDensity = Math.min(100, Math.max(0,
    20 + (totalWords > 0 ? (doctrineTerms / totalWords) * 2000 : 0)
  ))

  // Readability: shorter sentences + common words = more readable
  const readability = Math.min(100, Math.max(0,
    80 - (avgSentenceLen > 40 ? 20 : avgSentenceLen > 30 ? 10 : 0)
    - doctrinalDensity * 0.2
  ))

  // Engagement: questions, stories, direct address
  const questions = (text.match(/[？?]/g) || []).length
  const directAddress = (text.match(/你们|我们|弟兄|姐妹|亲爱的/g) || []).length
  const storyMarkers = (text.match(/有一天|曾经|有个|就像|好比|例如/g) || []).length
  const engagement = Math.min(100, Math.max(0,
    40 + questions * 2 + directAddress * 3 + storyMarkers * 5
  ))

  return {
    formality: Math.round(formality),
    emotion: Math.round(emotion),
    doctrinalDensity: Math.round(doctrinalDensity),
    readability: Math.round(readability),
    engagement: Math.round(engagement),
  }
}
