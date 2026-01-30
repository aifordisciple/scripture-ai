// lib/constants.ts

// 1. 深度优化的 System Prompt (保持你提供的最新版)
export const SYSTEM_PROMPT = `
你是一位精通希腊文 (Greek)、希伯来文 (Hebrew)、系统神学以及正统解经传统的圣经学者。
你的目标是帮助用户深入理解圣经，并将古代真理应用于现代生活。

### 🛡️ 核心解经原则 (Guardrails)
1. **历史文法解经 (Historical-Grammatical)**：优先基于上下文 (Context)、历史背景和语法结构解释，避免私意解经。
2. **以基督为中心 (Christ-Centered)**：在旧约中寻找基督的预表，在新约中高举基督的救赎。
3. **正统信仰**：遵循尼西亚信经框架。若涉及宗派争议（如预定论 vs 自由意志），请客观列出主要观点，保持中立。

### ⚠️ 注意事项
- **引用标注**：如引用了知名解经家（如加尔文、摩根），请明确标注。
- **语气**：温柔、谦卑、造就人，如同牧者与信徒交谈。
- **排版**：善用 **加粗** 强调核心神学概念。

### 📝 输出格式规范 (Markdown)
无论用户问什么，请尽量遵循以下结构化 Markdown 格式输出（视具体问题调整）：

### 🎯 解读范围
- **经文**: [明确列出书卷、章节号，例如：创世记 1:1-3]
- **核心词**: [列出 1-3 个你将重点分析的关键中文词或原文词]

### 📖 背景与情境
[简述作者、受众、写作目的及上下文逻辑，100字以内]

### 🔍 逐节释经
- **[关键短语/词]**: [解释]
- **[原文单词]** (*音译*): [Strong's编号] [原意及时态分析]

### 💡 现代应用
1. [应用点一]
2. [应用点二]
3. [应用点三]

### 🤔 反思问题

基于全章内容，向读者提出一个苏格拉底式的反思问题，引导其将经文应用到生活中。

`;

// 2. 圣经书卷数据 (保持不变，此处省略以节省篇幅，请保留原有的 BIBLE_BOOKS 数组)
export const BIBLE_BOOKS = [
  // ... (保留你原有的 66 卷书数据) ...
  // --- 旧约 ---
  { name: "创世记", id: "Gen", chapters: 50 },
  { name: "出埃及记", id: "Exo", chapters: 40 },
  { name: "利未记", id: "Lev", chapters: 27 },
  { name: "民数记", id: "Num", chapters: 36 },
  { name: "申命记", id: "Deu", chapters: 34 },
  { name: "约书亚记", id: "Jos", chapters: 24 },
  { name: "士师记", id: "Jdg", chapters: 21 },
  { name: "路得记", id: "Rut", chapters: 4 },
  { name: "撒母耳记上", id: "1Sa", chapters: 31 },
  { name: "撒母耳记下", id: "2Sa", chapters: 24 },
  { name: "列王纪上", id: "1Ki", chapters: 22 },
  { name: "列王纪下", id: "2Ki", chapters: 25 },
  { name: "历代志上", id: "1Ch", chapters: 29 },
  { name: "历代志下", id: "2Ch", chapters: 36 },
  { name: "以斯拉记", id: "Ezr", chapters: 10 },
  { name: "尼希米记", id: "Neh", chapters: 13 },
  { name: "以斯帖记", id: "Est", chapters: 10 },
  { name: "约伯记", id: "Job", chapters: 42 },
  { name: "诗篇", id: "Psa", chapters: 150 },
  { name: "箴言", id: "Pro", chapters: 31 },
  { name: "传道书", id: "Ecc", chapters: 12 },
  { name: "雅歌", id: "Sng", chapters: 8 },
  { name: "以赛亚书", id: "Isa", chapters: 66 },
  { name: "耶利米书", id: "Jer", chapters: 52 },
  { name: "耶利米哀歌", id: "Lam", chapters: 5 },
  { name: "以西结书", id: "Eze", chapters: 48 },
  { name: "但以理书", id: "Dan", chapters: 12 },
  { name: "何西阿书", id: "Hos", chapters: 14 },
  { name: "约珥书", id: "Jol", chapters: 3 },
  { name: "阿摩司书", id: "Amo", chapters: 9 },
  { name: "俄巴底亚书", id: "Oba", chapters: 1 },
  { name: "约拿书", id: "Jon", chapters: 4 },
  { name: "弥迦书", id: "Mic", chapters: 7 },
  { name: "那鸿书", id: "Nah", chapters: 3 },
  { name: "哈巴谷书", id: "Hab", chapters: 3 },
  { name: "西番雅书", id: "Zep", chapters: 3 },
  { name: "哈该书", id: "Hag", chapters: 2 },
  { name: "撒迦利亚书", id: "Zec", chapters: 14 },
  { name: "玛拉基书", id: "Mal", chapters: 4 },
  // --- 新约 ---
  { name: "马太福音", id: "Mat", chapters: 28 },
  { name: "马可福音", id: "Mrk", chapters: 16 },
  { name: "路加福音", id: "Luk", chapters: 24 },
  { name: "约翰福音", id: "Jhn", chapters: 21 },
  { name: "使徒行传", id: "Act", chapters: 28 },
  { name: "罗马书", id: "Rom", chapters: 16 },
  { name: "哥林多前书", id: "1Co", chapters: 16 },
  { name: "哥林多后书", id: "2Co", chapters: 13 },
  { name: "加拉太书", id: "Gal", chapters: 6 },
  { name: "以弗所书", id: "Eph", chapters: 6 },
  { name: "腓立比书", id: "Php", chapters: 4 },
  { name: "歌罗西书", id: "Col", chapters: 4 },
  { name: "帖撒罗尼迦前书", id: "1Th", chapters: 5 },
  { name: "帖撒罗尼迦后书", id: "2Th", chapters: 3 },
  { name: "提摩太前书", id: "1Ti", chapters: 6 },
  { name: "提摩太后书", id: "2Ti", chapters: 4 },
  { name: "提多书", id: "Tit", chapters: 3 },
  { name: "腓利门书", id: "Phm", chapters: 1 },
  { name: "希伯来书", id: "Heb", chapters: 13 },
  { name: "雅各书", id: "Jas", chapters: 5 },
  { name: "彼得前书", id: "1Pe", chapters: 5 },
  { name: "彼得后书", id: "2Pe", chapters: 3 },
  { name: "约翰一书", id: "1Jn", chapters: 5 },
  { name: "约翰二书", id: "2Jn", chapters: 1 },
  { name: "约翰三书", id: "3Jn", chapters: 1 },
  { name: "犹大书", id: "Jud", chapters: 1 },
  { name: "启示录", id: "Rev", chapters: 22 },
];

// 3. 快捷指令配置
export const THEOLOGICAL_PROMPTS = [
  {
    id: 'detail',
    label: "🧩 详细讲解",
    // 修正：这里不能放 SYSTEM_PROMPT，否则用户聊天框会显示一大段规则。
    // 我们只需要发一个简单的指令，AI 就会按 System Prompt 的规定格式回答。
    prompt: "请详细解读这节经文，包含背景、逐节释经和现代应用。", 
    color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" // 改为紫色，区分于 amber
  },
  {
    id: 'context',
    label: "📜 历史背景",
    prompt: "请结合当时的地理、历史和文化背景，简要解释这段经文。重点说明：作者是谁？对谁说的？目的是什么？",
    color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
  },
  {
    id: 'original',
    label: "🔍 原文解析",
    prompt: "请找出这段经文中 1-2 个最关键的希伯来文或希腊文单词，解释其原意、词根，以及它如何丰富了我们对经文的理解。",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
  },
  {
    id: 'application',
    label: "💡 生活应用",
    prompt: "基于这段经文的神学原则，请给出 3 个具体的、造就人的现代生活应用建议（例如在职场、家庭或个人灵修中）。",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
  }
];

// --- 新增：整章摘要专用 Prompt ---
export const CHAPTER_SUMMARY_PROMPT = `
请为这一整章经文生成一份结构严谨的神学摘要。

### 格式要求
1. **🗝️ 核心主题**：用一句话概括全章主旨。
2. **🏗️ 结构大纲**：列出本章的 2-3 个主要分段及其大意。
3. **💎 神学要点**：提取本章最关键的神学教义（如救赎、审判、恩典、圣约等）。
4. **🤔 反思问题**：基于全章内容，向读者提出一个苏格拉底式的反思问题，引导其将经文应用到生活中。

请保持输出简洁、深刻。
`;