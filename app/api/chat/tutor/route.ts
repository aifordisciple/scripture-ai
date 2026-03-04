// app/api/chat/tutor/route.ts
// AI Tutor - Socratic method Bible study assistant

import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

// Socratic Tutor Prompt
const TUTOR_PROMPT = `
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
`;

export async function POST(req: Request) {
  try {
    const { question, verseRef, verseContent, conversationHistory } = await req.json();
    
    const session = await auth(); 
    const userId = session?.user?.id;

    // Get AI config
    const provider = process.env.AI_PROVIDER || 'openai';
    const modelName = process.env.OLLAMA_MODEL || 'llama3'; 
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434/v1';

    let model;
    if (provider === 'ollama') {
      const ollama = createOpenAI({ baseURL: ollamaBaseUrl, apiKey: 'ollama' });
      model = ollama(modelName);
    } else if (provider === 'deepseek') {
       const deepseek = createOpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey: process.env.DEEPSEEK_API_KEY });
       model = deepseek('deepseek-chat');
    } else {
      const openai = createOpenAI({ baseURL: process.env.OPENAI_BASE_URL, apiKey: process.env.OPENAI_API_KEY });
      model = openai(process.env.OPENAI_MODEL || 'gpt-4o-mini');
    }

    // Build conversation context
    const systemPrompt = TUTOR_PROMPT
      .replace('{userQuestion}', question || '无')
      .replace('{verseRef}', verseRef || '未指定');

    // Build messages
    const messages = [
      { role: 'system' as const, content: systemPrompt },
    ];

    // Add conversation history (last 4 messages for context)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-4);
      recentHistory.forEach((msg: { role: string; content: string }) => {
        messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
      });
    }

    // Add current question
    messages.push({ 
      role: 'user' as const, 
      content: verseContent ? 
        `问题: ${question}\n相关经文: ${verseRef}\n${verseContent}` : 
        `问题: ${question}`
    });

    const result = await streamText({
      model,
      messages,
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error("❌ Tutor API Error:", error);
    return new Response(JSON.stringify({ error: '导师服务暂时不可用' }), { status: 500 });
  }
}
