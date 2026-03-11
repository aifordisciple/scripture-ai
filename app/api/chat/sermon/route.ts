// app/api/chat/sermon/route.ts
// AI Sermon Outline Generator - Create sermon outlines from Bible passages

import { generateText } from 'ai';
import { auth } from "@/lib/auth";
import { getAIModel, extractApiConfig } from '@/lib/ai-client';

export const maxDuration = 60;

// Sermon Outline Prompt
const SERMON_PROMPT = `
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
`;

export async function POST(req: Request) {
  try {
    const { apiConfig, body } = await extractApiConfig(req);
    const { verseRef, bookName, chapter, verses, title, style = 'expository' } = body as {
      verseRef?: string;
      bookName?: string;
      chapter?: number;
      verses?: string;
      title?: string;
      style?: string;
    };

    const session = await auth();

    // 使用集中式 AI 客户端
    const model = await getAIModel(apiConfig, session?.user?.id);

    // Build prompt
    let prompt = SERMON_PROMPT
      .replace('{verseRef}', verseRef || `${bookName || ''} ${chapter || ''}:${verses || ''}`);

    if (verses) {
      prompt += `\n\n### 参考经文内容\n${verses}`;
    }

    if (title) {
      prompt += `\n\n### 指定主题: ${title}`;
    }

    if (style) {
      prompt += `\n\n### 讲道风格: ${style === 'expository' ? '释经式讲道' : style === 'topical' ? '主题式讲道' : '叙事式讲道'}`;
    }

    const result = await generateText({
      model,
      prompt,
    });

    return new Response(JSON.stringify({
      sermon: result.text,
      metadata: {
        verseRef,
        bookName,
        chapter,
        verses,
        title,
        style,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ Sermon API Error:", error);
    return new Response(JSON.stringify({ error: '讲道大纲生成失败' }), { status: 500 });
  }
}