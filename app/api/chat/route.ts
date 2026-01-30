// app/api/chat/route.ts
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { SYSTEM_PROMPT } from '@/lib/constants';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    console.log("----- 1. 收到前端请求 -----");
    
    // --- 核心修改：构造分层的 Context Prompt ---
    let userContext = "";
    
    if (context) {
      // 兼容旧逻辑：如果前端没传 selectedText，回退到 content
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

    const result = await streamText({
      model: model,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'system', content: userContext }, // 使用新的分层 Context
        ...messages,
      ],
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