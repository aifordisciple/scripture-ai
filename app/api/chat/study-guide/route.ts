// app/api/chat/study-guide/route.ts
// AI Study Guide Generator - Create personalized Bible study questions

import { generateText } from 'ai';
import { auth } from "@/lib/auth";
import { getAIModel, extractApiConfig } from '@/lib/ai-client';

export const maxDuration = 60;

// Study Guide Prompt
const STUDY_GUIDE_PROMPT = `
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
`;

export async function POST(req: Request) {
  try {
    const { apiConfig, body } = await extractApiConfig(req);
    const { bookName, chapter, verseRange, verseContent, questionCount = 5 } = body as {
      bookName?: string;
      chapter?: number;
      verseRange?: string;
      verseContent?: string;
      questionCount?: number;
    };

    const session = await auth();

    // 使用集中式 AI 客户端
    const model = await getAIModel(apiConfig, session?.user?.id);

    // Build prompt
    let prompt = STUDY_GUIDE_PROMPT
      .replace('{bookName}', bookName || '未指定')
      .replace('{chapter}', String(chapter || ''))
      .replace('{verseRange}', verseRange || '全章');

    // Add verse content if provided
    if (verseContent) {
      prompt += `\n\n### 参考经文\n${verseContent}`;
    }

    const result = await generateText({
      model,
      prompt,
    });

    return new Response(JSON.stringify({
      guide: result.text,
      metadata: {
        bookName,
        chapter,
        verseRange,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ Study Guide API Error:", error);
    return new Response(JSON.stringify({ error: '查经材料生成失败' }), { status: 500 });
  }
}