// app/api/chat/route.ts
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { SYSTEM_PROMPT } from '@/lib/constants';
import { getServerSession } from "next-auth"; // [新增]
import { authOptions } from "@/lib/auth"; // [新增]
import { prisma } from "@/lib/prisma"; // [新增]

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

// [新增] 获取当前登录用户
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // [新增] 保存用户的提问到数据库
    if (userId) {
       const lastUserMessage = messages[messages.length - 1];
       if (lastUserMessage && lastUserMessage.role === 'user') {
          await prisma.chatMessage.create({
             data: { userId, role: 'user', content: lastUserMessage.content }
          });
       }
    }

    console.log("----- 1. 收到前端请求 -----");
    
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

    console.log(`----- 2. 准备调用模型: ${provider} -----`);

    let model;

    if (provider === 'ollama') {
      const ollama = createOpenAI({
        baseURL: ollamaBaseUrl,
        apiKey: 'ollama', 
      });
      model = ollama(modelName);
    } else if (provider === 'deepseek') {
       const deepseek = createOpenAI({
         baseURL: 'https://api.deepseek.com/v1',
         apiKey: process.env.DEEPSEEK_API_KEY,
       });
       model = deepseek('deepseek-chat');
    } else {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      model = openai('gpt-4o-mini');
    }

    console.log("----- 3. 开始流式传输 -----");

    // [关键修复] 强制要求模型输出 <think> 标签
    const enforceThinkingPrompt = `
${SYSTEM_PROMPT}

【⚠️ 强制输出格式指令】
为了保证逻辑严密，在回答任何问题之前，你**必须**先进行深度思考，并严格将所有的思考过程放在 <think> 和 </think> 标签之间！
必须严格遵循以下格式：
<think>
在这里写下你的分析、经文比对、神学推导等思考过程...
</think>
在这里写下你最终的优美排版回复...
`;

    const result = await streamText({
      model: model,
      system: enforceThinkingPrompt,
      messages: [
        { role: 'system', content: userContext },
        ...messages,
      ],
      // [新增] AI 流式输出完成后，保存 AI 的回答
      onFinish: async ({ text }) => {
         if (userId) {
            await prisma.chatMessage.create({
               data: { userId, role: 'assistant', content: text }
            });
         }
      },
      onError: (error) => {
        console.error("❌ AI 生成出错 (Stream阶段):", error);
      }
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error("❌ API 路由致命错误:", error);
    return new Response(JSON.stringify({ error: '后端处理失败' }), { status: 500 });
  }
}