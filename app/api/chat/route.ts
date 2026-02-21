// app/api/chat/route.ts
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { SYSTEM_PROMPT } from '@/lib/constants';
import { auth } from "@/lib/auth"; // [修改] 导入 v5 的 auth 函数
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();
    
    // [修改] 直接调用 auth() 获取当前登录用户会话
    const session = await auth(); 
    const userId = session?.user?.id;

    // 如果用户已登录，保存用户的提问到数据库
    if (userId) {
       const lastUserMessage = messages[messages.length - 1];
       if (lastUserMessage && lastUserMessage.role === 'user') {
          await prisma.chatMessage.create({
             data: { userId, role: 'user', content: lastUserMessage.content }
          });
       }
    }

    // --- 构造分层的 Context Prompt ---
    let userContext = "";
    if (context) {
      const focusText = context.selectedText || context.content; 
      const backgroundText = context.contextText || ""; 

      userContext = `
【当前任务】
用户正在阅读《${context.bookName}》第 ${context.chapter} 章。
请针对用户选中的经文进行解读。

【🎯 用户选中的经文 (重点解读对象)】
${focusText}

【📖 上下文参考 (仅供理解背景，无需逐字解释)】
${backgroundText}
`;
    }

    // 获取配置
    const provider = process.env.AI_PROVIDER || 'openai';
    const modelName = process.env.OLLAMA_MODEL || 'llama3'; 
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';

    let model;
    if (provider === 'ollama') {
      const ollama = createOpenAI({ baseURL: ollamaBaseUrl, apiKey: 'ollama' });
      model = ollama(modelName);
    } else if (provider === 'deepseek') {
       const deepseek = createOpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey: process.env.DEEPSEEK_API_KEY });
       model = deepseek('deepseek-chat');
    } else {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      model = openai('gpt-4o-mini');
    }

    // 强制思考模式 Prompt
    const enforceThinkingPrompt = `
${SYSTEM_PROMPT}

【⚠️ 强制输出格式指令】
为了保证逻辑严密，在回答任何问题之前，你**必须**先进行深度思考，并严格将所有的思考过程放在 <think> 和 </think> 标签之间！
格式：
<think>思考过程...</think>
最终优美排版的回复...
`;

    const result = await streamText({
      model: model,
      system: enforceThinkingPrompt,
      messages: [
        { role: 'system', content: userContext },
        ...messages,
      ],
      // AI 流式输出完成后，保存回复到数据库
      onFinish: async ({ text }) => {
         if (userId) {
            await prisma.chatMessage.create({
               data: { userId, role: 'assistant', content: text }
            });
         }
      }
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error("❌ API 路由致命错误:", error);
    return new Response(JSON.stringify({ error: '后端处理失败' }), { status: 500 });
  }
}