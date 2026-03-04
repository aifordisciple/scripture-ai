// packages/core/src/ai/chat.ts
// AI Chat module

import { SYSTEM_PROMPT, THEOLOGICAL_PROMPTS, VerseRef } from '../constants';
import { getApiBaseUrl } from '../bible/reader';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatContext {
  selectedText?: string;
  content?: string;
  contextText?: string;
  bookName?: string;
  chapter?: number;
  verse?: number;
}

export interface ChatOptions {
  context?: ChatContext;
  stream?: boolean;
}

// Send message to AI chat
export async function sendChatMessage(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const { context } = options;
  
  const response = await fetch(`${getApiBaseUrl()}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      context
    })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Chat failed');
  }
  
  // For streaming, return the response body
  if (options.stream) {
    return response.body?.getReader() ? 'stream' : await response.text();
  }
  
  const data = await response.json();
  return data.text || '';
}

// Stream chat messages
export async function* streamChatMessage(
  messages: ChatMessage[],
  options: ChatOptions = {}
): AsyncGenerator<string> {
  const { context } = options;
  
  const response = await fetch(`${getApiBaseUrl()}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      context
    })
  });
  
  if (!response.ok) {
    throw new Error('Chat failed');
  }
  
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }
  
  const decoder = new TextDecoder();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              yield parsed.text;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Get chapter summary
export async function getChapterSummary(
  bookId: string,
  chapter: number,
  verses: string
): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}/chat/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bookId,
      chapter,
      verses
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to get summary');
  }
  
  const data = await response.json();
  return data.text || '';
}

// Generate prayer from verse
export async function generatePrayer(
  verse: VerseRef,
  content: string
): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}/chat/prayer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      verse,
      content
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate prayer');
  }
  
  const data = await response.json();
  return data.text || '';
}

// Get theological prompts
export function getTheologicalPrompts() {
  return THEOLOGICAL_PROMPTS;
}

// Build context prompt from verse selection
export function buildContextPrompt(
  bookName: string,
  chapter: number,
  selectedText: string,
  contextText?: string
): string {
  return `
【当前任务】
用户正在阅读《${bookName}》第 ${chapter} 章。
请针对用户选中的经文进行深入且严谨的解读。

【🎯 用户选中的经文 (重点解读对象)】
${selectedText}

【📖 上下文参考 (仅供理解背景，无需逐字解释)】
${contextText || '无'}
`;
}
