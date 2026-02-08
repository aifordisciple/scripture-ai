// lib/constants.ts

// 1. 深度优化的 System Prompt (基于您的版本进行了增强)
export const SYSTEM_PROMPT = `
你是一位精通希腊文 (Greek)、希伯来文 (Hebrew)、系统神学、教会历史以及正统解经传统的圣经学者与灵修导师。
你的目标不仅仅是解释经文，更是通过深度的圣经真理，帮助用户建立与上帝更亲密的关系，并将真理应用在现代生活的方方面面。

### 🛡️ 核心解经原则 (Guardrails)
1. **历史文法解经 (Historical-Grammatical)**：
   - **上下文 (Context)**：必须在段落、书卷及整本圣经的脉络中解释经文。
   - **历史背景**：考虑作者、受众、写作时间、地理及文化习俗。
   - **文体分析**：区分叙事、诗歌、预言、书信等不同文体，采用相应的解释原则。
2. **以基督为中心 (Christ-Centered)**：
   - **旧约**：寻找基督的预表、预言及救赎历史的铺垫。
   - **新约**：高举基督的位格、工作及他在信徒生命中的主权。
3. **以经解经 (Scripture Interprets Scripture)**：用清晰的经文解释隐晦的经文，确保教义的一致性。
4. **正统信仰**：遵循尼西亚信经、使徒信经框架。若涉及宗派争议（如预定论 vs 自由意志、千禧年观点），请客观列出主要正统观点，保持中立，避免陷入无益的争辩。

### ⚠️ 注意事项
- **引用标注**：如引用了知名解经家（如奥古斯丁、路德、加尔文、司布真、摩根等）或信条，请明确标注。
- **语气风格**：
   - **学者**：严谨、准确、有理有据。
   - **牧者**：温柔、劝勉、安慰、造就人。
   - **向导**：清晰指引，避免晦涩难懂的神学术语堆砌，必要时提供通俗解释。
- **排版**：善用 **加粗** 强调核心神学概念，使用列表使结构清晰。

### 📝 输出格式规范 (Markdown) - 默认参考模板
*(针对经文解读请求，请尽量遵循此结构，可视具体问题灵活调整)*

### 🎯 解读范围
- **经文**: [明确列出书卷、章节号]
- **核心主题**: [用一句话概括这段经文的中心思想]

### 📖 背景与情境 (Context)
[简述作者、受众、写作目的及上下文逻辑，帮助读者进入当时的情境。约100-150字]

### 🔍 深度释经 (Exegesis)
*(挑选 2-3 个关键点进行深入剖析)*
- **[关键短语/概念]**: [解释其神学含义]
- **[原文单词]** (*原文音译*): [Strong's编号 (可选)] [原意、时态或词根分析，以及它如何丰富了经文的意义]
- **[难点/争议]**: [如果有明显的解经难点，简要说明]

### ✝️ 基督视角 (Christ connection)
[简要说明这段经文如何指向耶稣基督，或与福音信息相关联]

### 💡 现代应用 (Application)
1. **个人生命**: [如何应用在个人灵修、品格塑造上]
2. **生活实践**: [如何应用在家庭、职场、教会或社会关系中]

### 🙏 引导祷告 (Prayer)
[基于这段经文，写一段简短、真诚的祷告文，帮助读者回应上帝]

### 🤔 反思问题 (Reflection)
[提出一个苏格拉底式的反思问题，引导读者深入默想，将经文内化]
`;

// 2. 圣经书卷数据 (增加了分类和简介，使数据更丰富，前端可用于展示)
export const BIBLE_BOOKS = [
  // --- 旧约 ---
  // 律法书 (Pentateuch)
  { name: "创世记", id: "Gen", chapters: 50, category: "律法书", intro: "万物的起源，上帝的创造与拣选。" },
  { name: "出埃及记", id: "Exo", chapters: 40, category: "律法书", intro: "上帝的救赎，律法的颁布与帐幕的建立。" },
  { name: "利未记", id: "Lev", chapters: 27, category: "律法书", intro: "圣洁的国民，献祭与节期的条例。" },
  { name: "民数记", id: "Num", chapters: 36, category: "律法书", intro: "旷野的漂流，数点百姓与上帝的信实。" },
  { name: "申命记", id: "Deu", chapters: 34, category: "律法书", intro: "重申律法，对新一代的劝勉与契约。" },
  
  // 历史书 (Historical Books)
  { name: "约书亚记", id: "Jos", chapters: 24, category: "历史书", intro: "征服迦南，得地为业与信心的实践。" },
  { name: "士师记", id: "Jdg", chapters: 21, category: "历史书", intro: "背道与拯救的循环，以色列没有王的日子。" },
  { name: "路得记", id: "Rut", chapters: 4, category: "历史书", intro: "外邦女子的信心，大卫王的家谱与救赎的预表。" },
  { name: "撒母耳记上", id: "1Sa", chapters: 31, category: "历史书", intro: "王国的建立，扫罗的兴衰与大卫的受膏。" },
  { name: "撒母耳记下", id: "2Sa", chapters: 24, category: "历史书", intro: "大卫的王朝，罪的后果与上帝的恩典。" },
  { name: "列王纪上", id: "1Ki", chapters: 22, category: "历史书", intro: "王国的荣耀与分裂，所罗门的智慧与先知的警告。" },
  { name: "列王纪下", id: "2Ki", chapters: 25, category: "历史书", intro: "两国的衰亡与被掳，先知的事奉与上帝的审判。" },
  { name: "历代志上", id: "1Ch", chapters: 29, category: "历史书", intro: "大卫的谱系与事迹，圣殿敬拜的预备。" },
  { name: "历代志下", id: "2Ch", chapters: 36, category: "历史书", intro: "犹大诸王的统治，圣殿的兴衰与归回的盼望。" },
  { name: "以斯拉记", id: "Ezr", chapters: 10, category: "历史书", intro: "被掳归回，重建圣殿与信仰复兴。" },
  { name: "尼希米记", id: "Neh", chapters: 13, category: "历史书", intro: "重建城墙，社会改革与圣约的更新。" },
  { name: "以斯帖记", id: "Est", chapters: 10, category: "历史书", intro: "上帝隐秘的保守，犹大人的拯救。" },

  // 智慧文学 (Wisdom Literature)
  { name: "约伯记", id: "Job", chapters: 42, category: "智慧文学", intro: "义人受苦的奥秘，上帝的主权与智慧。" },
  { name: "诗篇", id: "Psa", chapters: 150, category: "智慧文学", intro: "赞美与祷告的诗集，心灵深处对上帝的回应。" },
  { name: "箴言", id: "Pro", chapters: 31, category: "智慧文学", intro: "敬畏耶和华的智慧，日常生活的指引。" },
  { name: "传道书", id: "Ecc", chapters: 12, category: "智慧文学", intro: "日光之下的虚空，日光之上的人生意在。" },
  { name: "雅歌", id: "Sng", chapters: 8, category: "智慧文学", intro: "良人与佳偶的爱情，基督与教会关系的预表。" },

  // 大先知书 (Major Prophets)
  { name: "以赛亚书", id: "Isa", chapters: 66, category: "大先知书", intro: "救恩的先知，弥赛亚的预言与上帝的国度。" },
  { name: "耶利米书", id: "Jer", chapters: 52, category: "大先知书", intro: "流泪的先知，审判的宣告与新约的应许。" },
  { name: "耶利米哀歌", id: "Lam", chapters: 5, category: "大先知书", intro: "为耶路撒冷哀哭，在苦难中仰望上帝的信实。" },
  { name: "以西结书", id: "Eze", chapters: 48, category: "大先知书", intro: "被掳中的异象，上帝的荣耀与枯骨复生。" },
  { name: "但以理书", id: "Dan", chapters: 12, category: "大先知书", intro: "外邦中的见证，历史的异象与末后的日子。" },

  // 小先知书 (Minor Prophets)
  { name: "何西阿书", id: "Hos", chapters: 14, category: "小先知书", intro: "上帝忠贞的爱，呼唤背道的百姓归回。" },
  { name: "约珥书", id: "Jol", chapters: 3, category: "小先知书", intro: "耶和华日子的临近，圣灵浇灌的应许。" },
  { name: "阿摩司书", id: "Amo", chapters: 9, category: "小先知书", intro: "公义的呼声，对罪恶与社会不义的审判。" },
  { name: "俄巴底亚书", id: "Oba", chapters: 1, category: "小先知书", intro: "对以东的审判，骄傲者的结局。" },
  { name: "约拿书", id: "Jon", chapters: 4, category: "小先知书", intro: "上帝对他国的怜悯，先知的逃避与顺服。" },
  { name: "弥迦书", id: "Mic", chapters: 7, category: "小先知书", intro: "行公义好怜悯，弥赛亚降生伯利恒的预言。" },
  { name: "那鸿书", id: "Nah", chapters: 3, category: "小先知书", intro: "尼尼微的倾覆，上帝对邪恶的报应。" },
  { name: "哈巴谷书", id: "Hab", chapters: 3, category: "小先知书", intro: "义人必因信得生，在患难中以神为乐。" },
  { name: "西番雅书", id: "Zep", chapters: 3, category: "小先知书", intro: "耶和华日子的审判，余民的欢呼与拯救。" },
  { name: "哈该书", id: "Hag", chapters: 2, category: "小先知书", intro: "重建圣殿的呼召，今日的荣耀必大过先前。" },
  { name: "撒迦利亚书", id: "Zec", chapters: 14, category: "小先知书", intro: "圣殿重建的异象，弥赛亚君王的降临。" },
  { name: "玛拉基书", id: "Mal", chapters: 4, category: "小先知书", intro: "上帝不变的爱，对十一奉献与事奉的辩论。" },

  // --- 新约 ---
  // 福音书 (Gospels)
  { name: "马太福音", id: "Mat", chapters: 28, category: "福音书", intro: "耶稣是君王，天国的福音与大卫的子孙。" },
  { name: "马可福音", id: "Mrk", chapters: 16, category: "福音书", intro: "耶稣是仆人，受苦的弥赛亚与服事的榜样。" },
  { name: "路加福音", id: "Luk", chapters: 24, category: "福音书", intro: "耶稣是人子，寻找拯救失丧的人。" },
  { name: "约翰福音", id: "Jhn", chapters: 21, category: "福音书", intro: "耶稣是神子，道成肉身与永生的恩典。" },

  // 历史书 (History)
  { name: "使徒行传", id: "Act", chapters: 28, category: "历史书", intro: "圣灵的工作，教会的建立与福音的广传。" },

  // 保罗书信 (Pauline Epistles)
  { name: "罗马书", id: "Rom", chapters: 16, category: "保罗书信", intro: "因信称义的真理，上帝的公义与人的救赎。" },
  { name: "哥林多前书", id: "1Co", chapters: 16, category: "保罗书信", intro: "教会生活的问题，爱与恩赐的运用。" },
  { name: "哥林多后书", id: "2Co", chapters: 13, category: "保罗书信", intro: "使徒的职分，苦难中的安慰与瓦器里的宝贝。" },
  { name: "加拉太书", id: "Gal", chapters: 6, category: "保罗书信", intro: "真自由的福音，脱离律法的辖制。" },
  { name: "以弗所书", id: "Eph", chapters: 6, category: "保罗书信", intro: "教会是基督的身体，在基督里合而为一。" },
  { name: "腓立比书", id: "Php", chapters: 4, category: "保罗书信", intro: "喜乐的书信，在基督里的满足与虚己。" },
  { name: "歌罗西书", id: "Col", chapters: 4, category: "保罗书信", intro: "基督的超越性，他是万有的元首。" },
  { name: "帖撒罗尼迦前书", id: "1Th", chapters: 5, category: "保罗书信", intro: "盼望主的再来，圣洁生活的劝勉。" },
  { name: "帖撒罗尼迦后书", id: "2Th", chapters: 3, category: "保罗书信", intro: "末世的警示，坚守信仰与勤做主工。" },
  { name: "提摩太前书", id: "1Ti", chapters: 6, category: "保罗书信", intro: "教牧书信，教会的治理与工人的资格。" },
  { name: "提摩太后书", id: "2Ti", chapters: 4, category: "保罗书信", intro: "保罗的遗言，无愧的工人与当跑的路。" },
  { name: "提多书", id: "Tit", chapters: 3, category: "保罗书信", intro: "纯正的道理，教会领袖的设立与信徒的善行。" },
  { name: "腓利门书", id: "Phm", chapters: 1, category: "保罗书信", intro: "基督里的接纳，爱心与饶恕的实践。" },

  // 普通书信 (General Epistles)
  { name: "希伯来书", id: "Heb", chapters: 13, category: "普通书信", intro: "基督超越天使与摩西，更美之约的中保。" },
  { name: "雅各书", id: "Jas", chapters: 5, category: "普通书信", intro: "信心的行为，听道与行道的结合。" },
  { name: "彼得前书", id: "1Pe", chapters: 5, category: "普通书信", intro: "活泼的盼望，在受苦中效法基督。" },
  { name: "彼得后书", id: "2Pe", chapters: 3, category: "普通书信", intro: "防备假教师，在恩典和知识上长进。" },
  { name: "约翰一书", id: "1Jn", chapters: 5, category: "普通书信", intro: "相交与相爱，确知有永生。" },
  { name: "约翰二书", id: "2Jn", chapters: 1, category: "普通书信", intro: "真理与爱心，不可接待敌基督者。" },
  { name: "约翰三书", id: "3Jn", chapters: 1, category: "普通书信", intro: "接待作客旅的弟兄，效法善不效法恶。" },
  { name: "犹大书", id: "Jud", chapters: 1, category: "普通书信", intro: "为真道竭力争辩，保守自己常在神的爱中。" },

  // 预言书 (Prophecy)
  { name: "启示录", id: "Rev", chapters: 22, category: "预言书", intro: "耶稣基督的启示，终局的得胜与新天新地。" },
];

// 3. 快捷指令配置 (Prompt Shortcuts)
// 增加多样化的指令，覆盖不同深度的需求
export const THEOLOGICAL_PROMPTS = [
  {
    id: 'detail',
    label: "🧩 深度解读",
    // 依然简洁，依赖 SYSTEM_PROMPT 的格式规范
    prompt: "请详细解读这段经文。请包含：背景与情境、核心词原文分析（希腊文/希伯来文）、神学要点以及现代应用。",
    color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
  },
  {
    id: 'context',
    label: "📜 历史背景",
    prompt: "请专注于这段经文的历史背景。作者是谁？写给谁？当时的文化、地理或政治环境如何影响我们对这段话的理解？",
    color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
  },
  {
    id: 'original',
    label: "🔍 原文词义",
    prompt: "请从这段经文中挑选 1-2 个最具神学意义的希伯来文或希腊文单词。解释它们的 Strong's 编号、原意、词根，以及这个词如何丰富了经文的含义。",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
  },
  {
    id: 'application',
    label: "💡 生活应用",
    prompt: "不要过于理论化，请给出 3 个切实可行的现代生活应用建议。这些建议应针对现代人的职场挑战、家庭关系或个人心理健康，并符合圣经原则。",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
  },
  {
    id: 'prayer',
    label: "🙏 祷告回应",
    prompt: "请基于这段经文的感动，为我写一篇祷告文。祷告应包含：对他属性的赞美、对罪的悔改、对恩典的感谢以及具体的祈求。语气要真诚、亲切。",
    color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
  },
  {
    id: 'explain_to_kid',
    label: "👶 儿童/初信讲解",
    prompt: "请用最简单、生动的语言（适合 10 岁儿童或初信者）解释这段经文的核心意思。可以使用生活中的比喻来帮助理解。",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"
  }
];

// --- 整章摘要专用 Prompt ---
export const CHAPTER_SUMMARY_PROMPT = `
请为这一整章经文生成一份结构严谨的神学摘要。

### 格式要求
1. **🗝️ 核心主题**：用一句话精炼地概括全章主旨。
2. **🏗️ 结构大纲**：列出本章的 2-4 个主要分段，并用简短的小标题和一句话概括段意。
3. **💎 神学要点**：提取本章最关键的神学教义（例如：上帝的属性、人的本性、救赎计划、圣约关系等）。
4. **✝️ 基督的影儿**：(如果是旧约)指出本章哪里预表了基督或与新约的关联；(如果是新约)指出本章如何彰显了基督的福音。
5. **🤔 反思问题**：基于全章内容，提出一个能触动人心、引发深度自我省察的问题。

请保持输出条理清晰，语言优美且富有感染力。
`;