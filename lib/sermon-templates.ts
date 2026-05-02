// 预置讲章模板的 Tiptap JSON 结构

export const EXPOSITORY_TEMPLATE = JSON.stringify({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '一、引言' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（引入经文和主题）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '二、经文背景' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（历史、文化、文学背景）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '三、经文释义' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（逐节解释经文含义）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '四、生活应用' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（将经文真理应用到当代生活）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '五、结语' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（总结与呼召）' }] },
  ],
})

export const TOPICAL_TEMPLATE = JSON.stringify({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '一、主题引入' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（提出主题和核心问题）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '二、圣经依据' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（引用相关经文支持主题）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '三、论证展开' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（从多角度论证主题）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '四、生活应用' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（主题在生活中的具体应用）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '五、呼召' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（邀请会众回应）' }] },
  ],
})

export const NARRATIVE_TEMPLATE = JSON.stringify({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '一、故事叙述' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（生动讲述圣经故事）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '二、转折点' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（故事中的关键转折）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '三、属灵启示' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（从故事中提取属灵真理）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '四、生活应用' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（将启示应用到日常生活中）' }] },
  ],
})

export const SERMON_TEMPLATES = {
  EXPOSITORY: EXPOSITORY_TEMPLATE,
  TOPICAL: TOPICAL_TEMPLATE,
  NARRATIVE: NARRATIVE_TEMPLATE,
} as const
