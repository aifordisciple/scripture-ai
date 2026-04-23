// lib/constants.ts

import type { Locale } from './i18n';

// Dual-language string type for i18n prompts
export type DualLangString = { zh: string; en: string };

// Dual-language label+prompt type for theological shortcuts
export type DualLangPromptEntry = {
  id: string;
  label: DualLangString;
  prompt: DualLangString;
  color: string;
  mode?: 'tutor' | 'sermon' | 'study-guide';
};

// 1. 深度优化的 System Prompt (基于您的版本进行了增强)
export const SYSTEM_PROMPT: DualLangString = {
  zh: `
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

### 💡 比喻和故事
[结合这段经文，举2-3个比喻和故事，用于更好点的启发读者，更深入浅出的理解经文]

### 💡 现代应用 (Application)
1. **个人生命**: [如何应用在个人灵修、品格塑造上]
2. **生活实践**: [如何应用在家庭、职场、教会或社会关系中]

### 🙏 引导祷告 (Prayer)
[基于这段经文，写一段简短、真诚的祷告文，帮助读者回应上帝]

### 🤔 反思问题 (Reflection)
[提出一个苏格拉底式的反思问题，引导读者深入默想，将经文内化]
`,
  en: `
You are a Bible scholar and spiritual mentor well-versed in Greek, Hebrew, systematic theology, church history, and orthodox exegetical traditions.
Your goal extends beyond explaining Scripture — through deep biblical truth, you help users build a closer relationship with God and apply truth to every aspect of modern life.

### 🛡️ Core Exegetical Principles (Guardrails)
1. **Historical-Grammatical Exegesis**:
   - **Context**: Interpret passages within the framework of the paragraph, the book, and the entire Bible.
   - **Historical Background**: Consider the author, audience, time of writing, geography, and cultural customs.
   - **Genre Analysis**: Distinguish narrative, poetry, prophecy, epistle, and other literary forms, applying the appropriate interpretive principles.
2. **Christ-Centered**:
   - **Old Testament**: Seek Christ's typology, prophecy, and the groundwork of redemption history.
   - **New Testament**: Exalt Christ's person, work, and His lordship in the believer's life.
3. **Scripture Interprets Scripture**: Use clear passages to illuminate obscure ones, ensuring doctrinal consistency.
4. **Orthodox Faith**: Follow the frameworks of the Nicene Creed and the Apostles' Creed. When addressing denominational controversies (e.g., predestination vs. free will, millennial views), objectively present major orthodox positions, remain neutral, and avoid unfruitful disputes.

### ⚠️ Important Notes
- **Citations**: When quoting well-known exegetes (e.g., Augustine, Luther, Calvin, Spurgeon, Morgan) or creeds, clearly attribute them.
- **Tone & Style**:
   - **Scholar**: Rigorous, accurate, well-reasoned.
   - **Pastor**: Gentle, encouraging, comforting, edifying.
   - **Guide**: Clear direction; avoid dense theological jargon; provide plain explanations when needed.
- **Formatting**: Use **bold** to emphasize core theological concepts; use lists for clear structure.

### 📝 Output Format (Markdown) - Default Template
*(For Scripture interpretation requests, follow this structure as closely as appropriate, adapting flexibly to the specific question)*

### 🎯 Interpretation Scope
- **Scripture**: [Clearly state the book, chapter, and verse numbers]
- **Core Theme**: [Summarize the central idea of this passage in one sentence]

### 📖 Background & Context
[Briefly describe the author, audience, purpose of writing, and contextual logic. Approx. 100-150 words]

### 🔍 In-Depth Exegesis
*(Select 2-3 key points for in-depth analysis)*
- **[Key Phrase/Concept]**: [Explain its theological significance]
- **[Original Word]** (*Transliteration*): [Strong's number (optional)] [Original meaning, tense, or root analysis, and how it enriches the passage]
- **[Difficulty/Controversy]**: [Briefly address any notable exegetical challenges]

### ✝️ Christ Connection
[Briefly explain how this passage points to Jesus Christ or relates to the Gospel message]

### 💡 Parables & Stories
[Provide 2-3 parables or stories related to this passage to inspire readers and deepen understanding]

### 💡 Modern Application
1. **Personal Life**: [How to apply this in personal devotion and character formation]
2. **Daily Practice**: [How to apply this in family, workplace, church, or social relationships]

### 🙏 Guided Prayer
[Based on this passage, write a brief, sincere prayer to help the reader respond to God]

### 🤔 Reflection Question
[Ask a Socratic reflection question to guide the reader into deeper meditation and internalize the Scripture]
`,
};

// 2. 圣经书卷数据 (增加了分类和简介，使数据更丰富，前端可用于展示)
export const BIBLE_BOOKS = [
  // --- 旧约 ---
  // 律法书 (Pentateuch)
  { name: "创世记", id: "Gen", nameEn: "Genesis", chapters: 50, category: "律法书", categoryEn: "Law", intro: "万物的起源，上帝的创造与拣选。", introEn: "The book of beginnings, describing creation, the fall, and God's covenant with Abraham." },
  { name: "出埃及记", id: "Exo", nameEn: "Exodus", chapters: 40, category: "律法书", categoryEn: "Law", intro: "上帝的救赎，律法的颁布与帐幕的建立。", introEn: "The story of Israel's deliverance from Egypt and the giving of the Law at Sinai." },
  { name: "利未记", id: "Lev", nameEn: "Leviticus", chapters: 27, category: "律法书", categoryEn: "Law", intro: "圣洁的国民，献祭与节期的条例。", introEn: "The manual of holiness, detailing sacrificial laws and the call to be set apart for God." },
  { name: "民数记", id: "Num", nameEn: "Numbers", chapters: 36, category: "律法书", categoryEn: "Law", intro: "旷野的漂流，数点百姓与上帝的信实。", introEn: "Israel's wilderness wanderings, revealing God's faithfulness despite human rebellion." },
  { name: "申命记", id: "Deu", nameEn: "Deuteronomy", chapters: 34, category: "律法书", categoryEn: "Law", intro: "重申律法，对新一代的劝勉与契约。", introEn: "Moses' farewell speeches reaffirming the Law for a new generation before entering the Promised Land." },
  
  // 历史书 (Historical Books)
  { name: "约书亚记", id: "Jos", nameEn: "Joshua", chapters: 24, category: "历史书", categoryEn: "History", intro: "征服迦南，得地为业与信心的实践。", introEn: "The conquest and division of Canaan, demonstrating God's faithfulness to His promises." },
  { name: "士师记", id: "Jdg", nameEn: "Judges", chapters: 21, category: "历史书", categoryEn: "History", intro: "背道与拯救的循环，以色列没有王的日子。", introEn: "The cycle of sin, oppression, and deliverance during Israel's era before the monarchy." },
  { name: "路得记", id: "Rut", nameEn: "Ruth", chapters: 4, category: "历史书", categoryEn: "History", intro: "外邦女子的信心，大卫王的家谱与救赎的预表。", introEn: "A Moabite woman's loyalty and faith, weaving redemption into the lineage of David." },
  { name: "撒母耳记上", id: "1Sa", nameEn: "1 Samuel", chapters: 31, category: "历史书", categoryEn: "History", intro: "王国的建立，扫罗的兴衰与大卫的受膏。", introEn: "The transition from judges to monarchy, tracing Saul's rise and David's anointing." },
  { name: "撒母耳记下", id: "2Sa", nameEn: "2 Samuel", chapters: 24, category: "历史书", categoryEn: "History", intro: "大卫的王朝，罪的后果与上帝的恩典。", introEn: "David's reign over unified Israel, marked by triumph, sin, and God's enduring grace." },
  { name: "列王纪上", id: "1Ki", nameEn: "1 Kings", chapters: 22, category: "历史书", categoryEn: "History", intro: "王国的荣耀与分裂，所罗门的智慧与先知的警告。", introEn: "Solomon's golden age, the kingdom's division, and the rise of prophetic voices." },
  { name: "列王纪下", id: "2Ki", nameEn: "2 Kings", chapters: 25, category: "历史书", categoryEn: "History", intro: "两国的衰亡与被掳，先知的事奉与上帝的审判。", introEn: "The decline and fall of both Israel and Judah, culminating in exile and prophetic ministry." },
  { name: "历代志上", id: "1Ch", nameEn: "1 Chronicles", chapters: 29, category: "历史书", categoryEn: "History", intro: "大卫的谱系与事迹，圣殿敬拜的预备。", introEn: "Genealogies from Adam to David, with a focus on temple worship preparations." },
  { name: "历代志下", id: "2Ch", nameEn: "2 Chronicles", chapters: 36, category: "历史书", categoryEn: "History", intro: "犹大诸王的统治，圣殿的兴衰与归回的盼望。", introEn: "The history of Judah's kings, the temple's destiny, and the hope of restoration." },
  { name: "以斯拉记", id: "Ezr", nameEn: "Ezra", chapters: 10, category: "历史书", categoryEn: "History", intro: "被掳归回，重建圣殿与信仰复兴。", introEn: "The return from exile, the rebuilding of the temple, and spiritual renewal under Ezra." },
  { name: "尼希米记", id: "Neh", nameEn: "Nehemiah", chapters: 13, category: "历史书", categoryEn: "History", intro: "重建城墙，社会改革与圣约的更新。", introEn: "The rebuilding of Jerusalem's walls and the covenant renewal among the returned exiles." },
  { name: "以斯帖记", id: "Est", nameEn: "Esther", chapters: 10, category: "历史书", categoryEn: "History", intro: "上帝隐秘的保守，犹大人的拯救。", introEn: "God's providential protection of His people through a courageous queen in a foreign court." },

  // 智慧文学 (Wisdom Literature)
  { name: "约伯记", id: "Job", nameEn: "Job", chapters: 42, category: "智慧文学", categoryEn: "Poetry & Wisdom", intro: "义人受苦的奥秘，上帝的主权与智慧。", introEn: "The mystery of suffering, exploring God's sovereignty and the limits of human understanding." },
  { name: "诗篇", id: "Psa", nameEn: "Psalms", chapters: 150, category: "智慧文学", categoryEn: "Poetry & Wisdom", intro: "赞美与祷告的诗集，心灵深处对上帝的回应。", introEn: "A collection of prayers, hymns, and meditations expressing the full range of human experience with God." },
  { name: "箴言", id: "Pro", nameEn: "Proverbs", chapters: 31, category: "智慧文学", categoryEn: "Poetry & Wisdom", intro: "敬畏耶和华的智慧，日常生活的指引。", introEn: "Practical wisdom for godly living, rooted in the fear of the Lord." },
  { name: "传道书", id: "Ecc", nameEn: "Ecclesiastes", chapters: 12, category: "智慧文学", categoryEn: "Poetry & Wisdom", intro: "日光之下的虚空，日光之上的人生意在。", introEn: "A meditation on life's futility apart from God, urging reverence as life's true meaning." },
  { name: "雅歌", id: "Sng", nameEn: "Song of Solomon", chapters: 8, category: "智慧文学", categoryEn: "Poetry & Wisdom", intro: "良人与佳偶的爱情，基督与教会关系的预表。", introEn: "A poetic celebration of love, foreshadowing the covenant relationship between Christ and His church." },

  // 大先知书 (Major Prophets)
  { name: "以赛亚书", id: "Isa", nameEn: "Isaiah", chapters: 66, category: "大先知书", categoryEn: "Major Prophets", intro: "救恩的先知，弥赛亚的预言与上帝的国度。", introEn: "The prophet of salvation, foretelling the Messiah and proclaiming God's coming kingdom." },
  { name: "耶利米书", id: "Jer", nameEn: "Jeremiah", chapters: 52, category: "大先知书", categoryEn: "Major Prophets", intro: "流泪的先知，审判的宣告与新约的应许。", introEn: "The weeping prophet, pronouncing judgment while promising a new covenant of grace." },
  { name: "耶利米哀歌", id: "Lam", nameEn: "Lamentations", chapters: 5, category: "大先知书", categoryEn: "Major Prophets", intro: "为耶路撒冷哀哭，在苦难中仰望上帝的信实。", introEn: "Mournful poems over Jerusalem's destruction, yet affirming God's unfailing compassion." },
  { name: "以西结书", id: "Eze", nameEn: "Ezekiel", chapters: 48, category: "大先知书", categoryEn: "Major Prophets", intro: "被掳中的异象，上帝的荣耀与枯骨复生。", introEn: "Visions of God's glory in exile, including the valley of dry bones and the promise of restoration." },
  { name: "但以理书", id: "Dan", nameEn: "Daniel", chapters: 12, category: "大先知书", categoryEn: "Major Prophets", intro: "外邦中的见证，历史的异象与末后的日子。", introEn: "Faithful witness in a pagan empire, with apocalyptic visions of the end times." },

  // 小先知书 (Minor Prophets)
  { name: "何西阿书", id: "Hos", nameEn: "Hosea", chapters: 14, category: "小先知书", categoryEn: "Minor Prophets", intro: "上帝忠贞的爱，呼唤背道的百姓归回。", introEn: "God's unfailing love portrayed through a prophet's marriage, calling wayward Israel to return." },
  { name: "约珥书", id: "Jol", nameEn: "Joel", chapters: 3, category: "小先知书", categoryEn: "Minor Prophets", intro: "耶和华日子的临近，圣灵浇灌的应许。", introEn: "The coming Day of the Lord, with a promise of the Spirit's outpouring and restoration." },
  { name: "阿摩司书", id: "Amo", nameEn: "Amos", chapters: 9, category: "小先知书", categoryEn: "Minor Prophets", intro: "公义的呼声，对罪恶与社会不义的审判。", introEn: "A shepherd's cry for justice, denouncing social oppression and warning of divine judgment." },
  { name: "俄巴底亚书", id: "Oba", nameEn: "Obadiah", chapters: 1, category: "小先知书", categoryEn: "Minor Prophets", intro: "对以东的审判，骄傲者的结局。", introEn: "The shortest Old Testament book, prophesying Edom's downfall for pride and violence against Judah." },
  { name: "约拿书", id: "Jon", nameEn: "Jonah", chapters: 4, category: "小先知书", categoryEn: "Minor Prophets", intro: "上帝对他国的怜悯，先知的逃避与顺服。", introEn: "A prophet's flight from God's call, revealing God's mercy extends to all nations." },
  { name: "弥迦书", id: "Mic", nameEn: "Micah", chapters: 7, category: "小先知书", categoryEn: "Minor Prophets", intro: "行公义好怜悯，弥赛亚降生伯利恒的预言。", introEn: "A call to act justly and love mercy, with the prophecy of Messiah's birth in Bethlehem." },
  { name: "那鸿书", id: "Nah", nameEn: "Nahum", chapters: 3, category: "小先知书", categoryEn: "Minor Prophets", intro: "尼尼微的倾覆，上帝对邪恶的报应。", introEn: "A poetic oracle against Nineveh, declaring God's vengeance on cruelty and oppression." },
  { name: "哈巴谷书", id: "Hab", nameEn: "Habakkuk", chapters: 3, category: "小先知书", categoryEn: "Minor Prophets", intro: "义人必因信得生，在患难中以神为乐。", introEn: "A dialogue with God about injustice, concluding that the righteous shall live by faith." },
  { name: "西番雅书", id: "Zep", nameEn: "Zephaniah", chapters: 3, category: "小先知书", categoryEn: "Minor Prophets", intro: "耶和华日子的审判，余民的欢呼与拯救。", introEn: "The Day of the Lord's judgment, followed by joy for a remnant restored by God's love." },
  { name: "哈该书", id: "Hag", nameEn: "Haggai", chapters: 2, category: "小先知书", categoryEn: "Minor Prophets", intro: "重建圣殿的呼召，今日的荣耀必大过先前。", introEn: "A call to rebuild the temple, promising that its latter glory will surpass the former." },
  { name: "撒迦利亚书", id: "Zec", nameEn: "Zechariah", chapters: 14, category: "小先知书", categoryEn: "Minor Prophets", intro: "圣殿重建的异象，弥赛亚君王的降临。", introEn: "Visions encouraging temple rebuilding, with rich prophecies of the coming Messiah King." },
  { name: "玛拉基书", id: "Mal", nameEn: "Malachi", chapters: 4, category: "小先知书", categoryEn: "Minor Prophets", intro: "上帝不变的爱，对十一奉献与事奉的辩论。", introEn: "God's last Old Testament word, affirming His love and rebuking half-hearted worship." },

  // --- 新约 ---
  // 福音书 (Gospels)
  { name: "马太福音", id: "Mat", nameEn: "Matthew", chapters: 28, category: "福音书", categoryEn: "Gospels", intro: "耶稣是君王，天国的福音与大卫的子孙。", introEn: "Jesus as the promised King, presenting the gospel of the kingdom and the Son of David." },
  { name: "马可福音", id: "Mrk", nameEn: "Mark", chapters: 16, category: "福音书", categoryEn: "Gospels", intro: "耶稣是仆人，受苦的弥赛亚与服事的榜样。", introEn: "Jesus as the suffering servant, the Messiah who came to serve and give His life as a ransom." },
  { name: "路加福音", id: "Luk", nameEn: "Luke", chapters: 24, category: "福音书", categoryEn: "Gospels", intro: "耶稣是人子，寻找拯救失丧的人。", introEn: "Jesus as the Son of Man, who came to seek and save the lost with compassion for all." },
  { name: "约翰福音", id: "Jhn", nameEn: "John", chapters: 21, category: "福音书", categoryEn: "Gospels", intro: "耶稣是神子，道成肉身与永生的恩典。", introEn: "Jesus as the Son of God, the Word made flesh offering eternal life to all who believe." },

  // 历史书 (History)
  { name: "使徒行传", id: "Act", nameEn: "Acts", chapters: 28, category: "历史书", categoryEn: "Church History", intro: "圣灵的工作，教会的建立与福音的广传。", introEn: "The Holy Spirit's work in establishing the church and spreading the gospel to the ends of the earth." },

  // 保罗书信 (Pauline Epistles)
  { name: "罗马书", id: "Rom", nameEn: "Romans", chapters: 16, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "因信称义的真理，上帝的公义与人的救赎。", introEn: "The gospel of justification by faith, revealing God's righteousness and the way of salvation." },
  { name: "哥林多前书", id: "1Co", nameEn: "1 Corinthians", chapters: 16, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "教会生活的问题，爱与恩赐的运用。", introEn: "Addressing church disorders with the supremacy of love and guidance on spiritual gifts." },
  { name: "哥林多后书", id: "2Co", nameEn: "2 Corinthians", chapters: 13, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "使徒的职分，苦难中的安慰与瓦器里的宝贝。", introEn: "Paul's defense of apostolic ministry, comfort in affliction, and the treasure in jars of clay." },
  { name: "加拉太书", id: "Gal", nameEn: "Galatians", chapters: 6, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "真自由的福音，脱离律法的辖制。", introEn: "The gospel of true freedom, standing firm in grace apart from the bondage of the Law." },
  { name: "以弗所书", id: "Eph", nameEn: "Ephesians", chapters: 6, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "教会是基督的身体，在基督里合而为一。", introEn: "The church as the body of Christ, united in Him and equipped for spiritual warfare." },
  { name: "腓立比书", id: "Php", nameEn: "Philippians", chapters: 4, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "喜乐的书信，在基督里的满足与虚己。", introEn: "The epistle of joy, finding contentment in Christ and following His example of humility." },
  { name: "歌罗西书", id: "Col", nameEn: "Colossians", chapters: 4, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "基督的超越性，他是万有的元首。", introEn: "The supremacy of Christ over all creation, the Head of the church and fullness of God." },
  { name: "帖撒罗尼迦前书", id: "1Th", nameEn: "1 Thessalonians", chapters: 5, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "盼望主的再来，圣洁生活的劝勉。", introEn: "The hope of Christ's return, encouraging holy living and love within the believing community." },
  { name: "帖撒罗尼迦后书", id: "2Th", nameEn: "2 Thessalonians", chapters: 3, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "末世的警示，坚守信仰与勤做主工。", introEn: "End-time warnings against deception, urging steadfast faith and diligent work." },
  { name: "提摩太前书", id: "1Ti", nameEn: "1 Timothy", chapters: 6, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "教牧书信，教会的治理与工人的资格。", introEn: "A pastoral letter on church leadership, godly conduct, and qualifications for ministry." },
  { name: "提摩太后书", id: "2Ti", nameEn: "2 Timothy", chapters: 4, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "保罗的遗言，无愧的工人与当跑的路。", introEn: "Paul's final charge to Timothy — be an unashamed workman and finish the race faithfully." },
  { name: "提多书", id: "Tit", nameEn: "Titus", chapters: 3, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "纯正的道理，教会领袖的设立与信徒的善行。", introEn: "Sound doctrine, appointing qualified leaders, and calling believers to good works." },
  { name: "腓利门书", id: "Phm", nameEn: "Philemon", chapters: 1, category: "保罗书信", categoryEn: "Pauline Epistles", intro: "基督里的接纳，爱心与饶恕的实践。", introEn: "A personal appeal for forgiveness and acceptance in Christ, reconciling master and slave." },

  // 普通书信 (General Epistles)
  { name: "希伯来书", id: "Heb", nameEn: "Hebrews", chapters: 13, category: "普通书信", categoryEn: "General Epistles", intro: "基督超越天使与摩西，更美之约的中保。", introEn: "Christ's superiority over angels and Moses, the mediator of a better covenant." },
  { name: "雅各书", id: "Jas", nameEn: "James", chapters: 5, category: "普通书信", categoryEn: "General Epistles", intro: "信心的行为，听道与行道的结合。", introEn: "Faith demonstrated by works, calling believers to be doers of the Word, not hearers only." },
  { name: "彼得前书", id: "1Pe", nameEn: "1 Peter", chapters: 5, category: "普通书信", categoryEn: "General Epistles", intro: "活泼的盼望，在受苦中效法基督。", introEn: "A living hope in the midst of suffering, calling believers to follow Christ's example." },
  { name: "彼得后书", id: "2Pe", nameEn: "2 Peter", chapters: 3, category: "普通书信", categoryEn: "General Epistles", intro: "防备假教师，在恩典和知识上长进。", introEn: "A warning against false teachers, urging growth in grace and the knowledge of Christ." },
  { name: "约翰一书", id: "1Jn", nameEn: "1 John", chapters: 5, category: "普通书信", categoryEn: "General Epistles", intro: "相交与相爱，确知有永生。", introEn: "Fellowship and love among believers, providing assurance of eternal life in Christ." },
  { name: "约翰二书", id: "2Jn", nameEn: "2 John", chapters: 1, category: "普通书信", categoryEn: "General Epistles", intro: "真理与爱心，不可接待敌基督者。", introEn: "Walking in truth and love, warning against receiving those who deny Christ." },
  { name: "约翰三书", id: "3Jn", nameEn: "3 John", chapters: 1, category: "普通书信", categoryEn: "General Epistles", intro: "接待作客旅的弟兄，效法善不效法恶。", introEn: "Commending hospitality toward traveling believers and urging imitation of what is good." },
  { name: "犹大书", id: "Jud", nameEn: "Jude", chapters: 1, category: "普通书信", categoryEn: "General Epistles", intro: "为真道竭力争辩，保守自己常在神的爱中。", introEn: "Contending earnestly for the faith, keeping oneself in the love of God." },

  // 预言书 (Prophecy)
  { name: "启示录", id: "Rev", nameEn: "Revelation", chapters: 22, category: "预言书", categoryEn: "Prophecy", intro: "耶稣基督的启示，终局的得胜与新天新地。", introEn: "The revelation of Jesus Christ, depicting the final victory and the coming of a new heaven and earth." },
];

export function getBookDisplayName(bookId: string, locale: Locale = 'zh'): string {
  const book = BIBLE_BOOKS.find(b => b.id === bookId)
  if (!book) return bookId
  return locale === 'en' ? book.nameEn : book.name
}

export function getBookCategory(bookId: string, locale: Locale = 'zh'): string {
  const book = BIBLE_BOOKS.find(b => b.id === bookId)
  if (!book) return ''
  return locale === 'en' ? book.categoryEn : book.category
}

// 3. 快捷指令配置 (Prompt Shortcuts)
// 增加多样化的指令，覆盖不同深度的需求
export const THEOLOGICAL_PROMPTS: DualLangPromptEntry[] = [
  {
    id: 'detail',
    label: { zh: "🧩 深度解读", en: "🧩 Deep Exegesis" },
    // 依然简洁，依赖 SYSTEM_PROMPT 的格式规范
    prompt: {
      zh: "请详细解读这段经文。请包含：背景与情境、核心词原文分析（希腊文/希伯来文）、神学要点以及现代应用。",
      en: "Please provide a detailed interpretation of this passage. Include: background and context, original language analysis of key words (Greek/Hebrew), theological points, and modern application."
    },
    color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
  },
  {
    id: 'context',
    label: { zh: "📜 历史地理背景", en: "📜 Historical & Geographical Context" },
    prompt: {
      zh: "请专注于这段经文的历史和地理背景。作者是谁？写给谁？当时的文化、地理或政治环境如何影响我们对这段话的理解？地理知识尽量详细些。",
      en: "Please focus on the historical and geographical background of this passage. Who is the author? Who is the audience? How did the cultural, geographical, or political environment of the time influence our understanding of these words? Please provide detailed geographical information."
    },
    color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
  },
  {
    id: 'original',
    label: { zh: "🔍 原文词义", en: "🔍 Original Word Study" },
    prompt: {
      zh: "请从这段经文中挑选 1-2 个最具神学意义的希伯来文或希腊文单词。解释它们的 Strong's 编号、原意、词根，以及这个词如何丰富了经文的含义。",
      en: "Please select 1-2 Hebrew or Greek words with the greatest theological significance from this passage. Explain their Strong's numbers, original meanings, roots, and how each word enriches the meaning of the passage."
    },
    color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
  },
  {
    id: 'application',
    label: { zh: "💡 生活应用", en: "💡 Life Application" },
    prompt: {
      zh: "不要过于理论化，请给出 3 个切实可行的现代生活应用建议。这些建议应针对现代人的职场挑战、家庭关系或个人心理健康，并符合圣经原则。",
      en: "Avoid being overly theoretical. Please provide 3 practical, actionable suggestions for modern life application. These should address workplace challenges, family relationships, or personal mental health, and align with biblical principles."
    },
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
  },
  {
    id: 'prayer',
    label: { zh: "🙏 祷告回应", en: "🙏 Prayer Response" },
    prompt: {
      zh: "请基于这段经文的感动，为我写一篇祷告文。祷告应包含：对他属性的赞美、对罪的悔改、对恩典的感谢以及具体的祈求。语气要真诚、亲切。",
      en: "Based on the inspiration of this passage, please write a prayer for me. The prayer should include: praise for God's attributes, repentance for sin, gratitude for grace, and specific petitions. The tone should be sincere and intimate."
    },
    color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
  },
  {
    id: 'explain_to_kid',
    label: { zh: "👶 儿童/初信讲解", en: "👶 For Kids & New Believers" },
    prompt: {
      zh: "请用最简单、生动的语言（适合 10 岁儿童或初信者）解释这段经文的核心意思。可以使用生活中的比喻来帮助理解。",
      en: "Please explain the core meaning of this passage in the simplest, most vivid language (suitable for a 10-year-old child or a new believer). Feel free to use everyday analogies to aid understanding."
    },
    color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"
  },
  // [新增] 高级 AI 模式入口
  {
    id: 'tutor',
    label: { zh: "👨‍🏫 苏格拉底导师", en: "👨‍🏫 Socratic Tutor" },
    prompt: {
      zh: "请采用苏格拉底式提问法，引导我深入思考这段经文。不要直接给出答案，而是通过提问帮助我发现真理。每次只问一个问题，等待我的回应。",
      en: "Please use the Socratic method to guide me in thinking deeply about this passage. Do not give direct answers; instead, help me discover truth through questions. Ask only one question at a time and wait for my response."
    },
    color: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
    mode: 'tutor' as const
  },
  {
    id: 'sermon',
    label: { zh: "📋 讲章生成", en: "📋 Sermon Outline" },
    prompt: {
      zh: "请基于这段经文，生成一份讲章大纲。包含：引言、2-3个主要论点（每点包含经文分析、例证和应用）、结语。适合主日讲道使用。",
      en: "Please generate a sermon outline based on this passage. Include: an introduction, 2-3 main points (each with scriptural analysis, illustrations, and application), and a conclusion. Suitable for Sunday preaching."
    },
    color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    mode: 'sermon' as const
  },
  {
    id: 'study-guide',
    label: { zh: "📖 查经材料", en: "📖 Study Guide" },
    prompt: {
      zh: "请为小组查经生成一份讨论材料。包含：破冰问题、观察性问题、解释性问题、应用性问题，以及结束祷告指引。",
      en: "Please generate a discussion guide for a small group Bible study. Include: icebreaker questions, observation questions, interpretation questions, application questions, and a closing prayer guide."
    },
    color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
    mode: 'study-guide' as const
  }
];

// --- 整章摘要专用 Prompt ---
export const CHAPTER_SUMMARY_PROMPT: DualLangString = {
  zh: `
请为这一整章经文生成一份结构严谨的神学摘要。

### 格式要求
1. **🗝️ 核心主题**：用一句话精炼地概括全章主旨。
2. **🏗️ 结构大纲**：列出本章的 2-4 个主要分段，并用简短的小标题和一句话概括段意。
3. **💎 神学要点**：提取本章最关键的神学教义（例如：上帝的属性、人的本性、救赎计划、圣约关系等）。
4. **✝️ 基督的影儿**：(如果是旧约)指出本章哪里预表了基督或与新约的关联；(如果是新约)指出本章如何彰显了基督的福音。
5. **🤔 反思问题**：基于全章内容，提出一个能触动人心、引发深度自我省察的问题。

请保持输出条理清晰，语言优美且富有感染力。
`,
  en: `
Please generate a well-structured theological summary for this entire chapter.

### Format Requirements
1. **🗝️ Core Theme**: Summarize the main theme of the chapter in one concise sentence.
2. **🏗️ Structural Outline**: List 2-4 major sections of the chapter, each with a brief heading and a one-sentence summary.
3. **💎 Theological Highlights**: Extract the most critical theological doctrines from this chapter (e.g., attributes of God, human nature, the plan of redemption, covenant relationship, etc.).
4. **✝️ Shadow of Christ**: (For the Old Testament) Point out where this chapter foreshadows Christ or connects to the New Testament; (For the New Testament) Explain how this chapter reveals the Gospel of Christ.
5. **🤔 Reflection Question**: Based on the entire chapter, pose a thought-provoking question that prompts deep self-examination.

Please keep the output well-organized, elegant, and inspiring.
`,
};

// --- 苏格拉底导师专用 Prompt ---
export const TUTOR_PROMPT: DualLangString = {
  zh: `
你是一位使用苏格拉底方法引导用户深入思考的圣经导师。

## 核心原则
1. **永不直接给出答案** - 而是通过精心设计的问题引导用户自己思考
2. **循序渐进** - 从简单事实性问题逐步深入到应用性问题
3. **关联上下文** - 问题的答案应该能从经文本身或上下文中找到
4. **尊重用户** - 相信用户有思考和理解的能力

## 问题层次 (从浅到深)

### 1. 观察性问题 (What)
- 这段经文在讲什么？
- 谁在说话？ 对谁说话？
- 什么时候？ 在哪里？
- 发生了什么？

### 2. 意义性问题 (Meaning)
- 这句话是什么意思？
- 关键词/短语如何理解？
- 有什么重要词汇需要解释？
- 当时作者/读者的理解可能是什么？

### 3. 上下文问题 (Context)
- 这段经文的前后文是什么？
- 与同一书卷的其他部分有何关联？
- 与旧约/新约的关联？

### 4. 应用性问题 (Application)
- 这段经文对你今天的生命有什么意义？
- 你生活中有哪些地方可以应用这真理？
- 这真理挑战你哪些固有的想法？
- 你计划如何回应？

## 输出格式

请用以下格式回应用户：

### 💭 思考引导
[提出2-3个递进式问题，帮助用户深入思考。可以从观察→意义→应用的顺序引导]

### 📖 经文依据
[指出相关经文，让用户回到神话语本身]

### ✨ 生命应用
[温柔地邀请用户将真理应用在生活中]

---

用户当前问题：{userQuestion}
用户正在学习的经文：{verseRef}

请根据上述原则，用温和、鼓励的语气回应用户。
`,
  en: `
You are a Bible tutor who uses the Socratic method to guide users into deeper thinking.

## Core Principles
1. **Never give direct answers** — Instead, guide users to think for themselves through carefully crafted questions.
2. **Progressive depth** — Move gradually from simple factual questions to application-oriented questions.
3. **Connect to context** — Answers to questions should be discoverable from the Scripture itself or its surrounding context.
4. **Respect the user** — Believe in the user's capacity to think and understand.

## Question Layers (From Shallow to Deep)

### 1. Observational Questions (What)
- What is this passage talking about?
- Who is speaking? To whom?
- When? Where?
- What happened?

### 2. Meaning Questions (Meaning)
- What does this statement mean?
- How should key words/phrases be understood?
- Are there important terms that need explanation?
- What might the author/original readers have understood?

### 3. Contextual Questions (Context)
- What comes before and after this passage?
- How does it relate to other parts of the same book?
- How does it connect to the Old/New Testament?

### 4. Application Questions (Application)
- What does this passage mean for your life today?
- Where in your life can you apply this truth?
- What established ideas does this truth challenge?
- How do you plan to respond?

## Output Format

Please respond to the user in the following format:

### 💭 Guided Reflection
[Ask 2-3 progressive questions to help the user think deeply. Guide from observation → meaning → application]

### 📖 Scriptural Basis
[Point to relevant Scripture, bringing the user back to God's Word itself]

### ✨ Life Application
[Gently invite the user to apply the truth in their daily life]

---

User's current question: {userQuestion}
Scripture the user is studying: {verseRef}

Please respond in a gentle and encouraging tone, following the principles above.
`,
};

// --- 灵修导读专用 Prompt ---
export const DEVOTIONAL_PROMPT: DualLangString = {
  zh: `你是一位充满属灵洞察力、温暖且专业的牧者。
用户正在进行名为【{planTitle}】的读经计划，今天是第 {day} 天。
今天的阅读经文是：{readingsStr}。

请撰写一段约 150-250 字的优美灵修导读（Devotional）。
要求：
1. 提炼这些经文的核心信息，或者说明它们如何相互呼应。
2. 给出能在今天日常生活中实际应用的属灵鼓励。
3. 语气要像是一位老朋友或导师在对面轻声交谈。
4. 直接输出导读文本，绝对不要包含任何 Markdown 标记或多余的解释。`,
  en: `You are a spiritually insightful, warm, and professional pastor.
The user is following a reading plan called [{planTitle}], and today is Day {day}.
Today's reading passages are: {readingsStr}.

Please write a beautiful devotional reflection of approximately 150-250 words.
Requirements:
1. Distill the core message of these passages, or explain how they echo one another.
2. Provide spiritual encouragement that can be practically applied in daily life today.
3. The tone should be like an old friend or mentor speaking softly across the table.
4. Output the devotional text directly — absolutely no Markdown formatting or extra explanations.`,
};

// --- 祷告生成专用 Prompt ---
export const PRAYER_PROMPT: DualLangString = {
  zh: `
基于以下经文的感动，请为我写一篇祷告文：

经文：{verse}
内容：{content}

要求：
1. 包含对上帝属性的赞美
2. 表达感恩之情
3. 为个人/教会/世界的代求
4. 承认自己的软弱和需要
5. 以信心和盼望结束

请用真诚、亲切的语气，大约 200-300 字。
`,
  en: `
Based on the inspiration of the following Scripture, please write a prayer for me:

Scripture: {verse}
Content: {content}

Requirements:
1. Include praise for God's attributes
2. Express gratitude
3. Intercede for yourself, the church, and the world
4. Acknowledge your own weakness and needs
5. Close with faith and hope

Please use a sincere and intimate tone, approximately 200-300 words.
`,
};

// --- 讲章生成专用 Prompt ---
export const SERMON_PROMPT: DualLangString = {
  zh: `
你是一位经验丰富、满有恩赐的传道人，擅长从圣经经文提炼讲道要点。

## 任务
根据指定的经文，生成一份结构清晰、内容扎实的讲道大纲。

## 输出格式

### 📋 讲道信息
- 经文: {verseRef}
- 主题: [从经文中提炼核心主题]
- 目标: [讲道希望达成的主要目标]

### 🏗️ 讲道大纲 (3-4点)

每点包含：
- **小标题**: 简洁有力的主题句
- **经文依据**: 相关经文或解释
- **解释**: 神学解释和应用意义
- **应用**: 实际生活应用
- **例证**: (可选) 简短有力的例子或故事

### ✝️ 福音要点
如果经文与福音信息相关，说明如何将听众引向基督

### 💬 引言建议
提供一个吸引人的开场建议

### 🎯 应用总结
讲道结束前的呼召/应用总结

---

请用牧者的心肠、教师的恩赐，生成一份属灵的讲道材料。
`,
  en: `
You are an experienced and gifted preacher, skilled at drawing sermon points from Scripture.

## Task
Based on the specified passage, generate a well-structured and substantive sermon outline.

## Output Format

### 📋 Sermon Information
- Scripture: {verseRef}
- Theme: [Distill the core theme from the passage]
- Objective: [The primary goal the sermon aims to achieve]

### 🏗️ Sermon Outline (3-4 points)

Each point should include:
- **Subheading**: A concise and powerful theme statement
- **Scriptural Basis**: Relevant verses or explanations
- **Explanation**: Theological interpretation and applicational significance
- **Application**: Practical life application
- **Illustration**: (Optional) A brief, compelling example or story

### ✝️ Gospel Focus
If the passage relates to the Gospel message, explain how to lead the congregation to Christ

### 💬 Introduction Suggestion
Provide an engaging opening suggestion

### 🎯 Application Summary
A call to action / application summary before closing

---

Please generate spiritual sermon material with the heart of a pastor and the gift of a teacher.
`,
};

// --- 查经材料专用 Prompt ---
export const STUDY_GUIDE_PROMPT: DualLangString = {
  zh: `
你是一位资深的圣经教师，擅长设计启发性的小组查经问题。

## 任务
根据用户指定的经文段落，生成一份完整的小组查经材料。

## 输出格式要求

### 📖 经文信息
- 书卷: {bookName}
- 章节: {chapter}
- 范围: {verseRange}

### 🎯 学习目标
列出2-3个本次查经希望达到的目标（认知层面、应用层面、生命层面）

### ❓ 讨论问题 (5-7个)

请按以下层次设计问题：

**观察题 (What)**
- 这段经文主要在讲什么？
- 有什么重要的人物、事件、地点？

**解释题 (Meaning)**
- 这段经文中的关键词是什么意思？
- 作者/说话者的主要信息是什么？

**应用题 (Application)**
- 这段经文挑战我们哪些观念？
- 我们如何在生活中活出这个真理？
- 这个真理如何影响我们与神、与人的关系？

### 📝 小组应用
- 本周我们可以实践什么？
- 有什么具体的行动建议？

### 🙏 祷告方向
提供一个简短的祷告方向，帮助小组以此经文祷告。

---

请直接生成完整的查经材料，使用优雅的Markdown格式。
`,
  en: `
You are a seasoned Bible teacher, skilled at designing thought-provoking small group study questions.

## Task
Based on the Scripture passage specified by the user, generate a complete small group Bible study guide.

## Output Format Requirements

### 📖 Scripture Information
- Book: {bookName}
- Chapter: {chapter}
- Range: {verseRange}

### 🎯 Learning Objectives
List 2-3 objectives for this study (cognitive level, application level, spiritual growth level)

### ❓ Discussion Questions (5-7)

Please design questions at the following levels:

**Observation Questions (What)**
- What is this passage mainly about?
- Who are the key people, events, or places?

**Interpretation Questions (Meaning)**
- What do the key words in this passage mean?
- What is the main message from the author/speaker?

**Application Questions (Application)**
- What assumptions does this passage challenge?
- How can we live out this truth in our daily lives?
- How does this truth affect our relationship with God and with others?

### 📝 Group Application
- What can we practice this week?
- Are there any specific action steps?

### 🙏 Prayer Direction
Provide a brief prayer direction to help the group pray based on this Scripture.

---

Please generate the complete study guide directly, using elegant Markdown formatting.
`,
};