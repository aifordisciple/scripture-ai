// lib/cross-reference-ai.ts
// AI-powered cross-reference description generator

import { generateText } from 'ai';
import { getAIModel, AIConfig } from './ai-client';

// Connection types
export type ConnectionType = 'THEMATIC' | 'QUOTATION' | 'PARALLEL' | 'PROPHECY' | 'ILLUSTRATION';

export interface ConnectionForAI {
  bookName: string;
  chapter: number;
  verse: number;
  content: string;
  type: ConnectionType;
}

export interface SourceVerse {
  bookName: string;
  chapter: number;
  verse: number;
  content: string;
}

// Chinese labels for connection types
const TYPE_LABELS: Record<ConnectionType, string> = {
  QUOTATION: '引用',
  PARALLEL: '平行',
  THEMATIC: '主题',
  PROPHECY: '预言',
  ILLUSTRATION: '例证',
};

// Prompt for generating connection descriptions - optimized for concise output
const CROSS_REF_PROMPT = `你是圣经研读助手。为以下关联经文各生成一句不超过25字的说明。

源经文：{source}

关联经文列表：
{connections}

要求：直接输出，格式为"书卷名 章:节|说明"，每行一条，不要任何思考过程或额外内容。
例如：
约翰福音 1:1|两处经文都论及太初之道
诗篇 33:6|都以神的话语为创造媒介`;

/**
 * Generate AI descriptions for cross-references
 */
export async function generateConnectionDescriptions(
  sourceVerse: SourceVerse,
  connections: ConnectionForAI[],
  apiConfig?: AIConfig
): Promise<Map<string, string>> {
  if (connections.length === 0) {
    return new Map();
  }

  try {
    const model = await getAIModel(apiConfig);

    // Limit to first 8 connections to avoid response truncation
    const limitedConnections = connections.slice(0, 8);

    const connectionList = limitedConnections
      .map((c) => `${c.bookName} ${c.chapter}:${c.verse}`)
      .join('\n');

    const prompt = CROSS_REF_PROMPT
      .replace('{source}', `${sourceVerse.bookName} ${sourceVerse.chapter}:${sourceVerse.verse}`)
      .replace('{connections}', connectionList);

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.3,
      maxTokens: 600,
    });

    console.log('[CrossRef AI] Raw response:', text);
    const parsed = parseDescriptions(text);
    console.log('[CrossRef AI] Parsed:', Object.fromEntries(parsed));
    return parsed;
  } catch (error) {
    console.error('[CrossRef AI] Failed to generate descriptions:', error);
    // 返回带错误标记的结果，而非静默返回空 Map
    const errorResult = new Map<string, string>();
    errorResult.set('__error__', 'AI 服务暂时不可用，请稍后重试');
    return errorResult;
  }
}

/**
 * Parse AI output to extract descriptions
 */
function parseDescriptions(text: string): Map<string, string> {
  const descriptions = new Map<string, string>();

  const lines = text.split('\n');
  console.log('[CrossRef AI] Total lines:', lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (!trimmedLine) continue;

    // Log each non-empty line for debugging
    console.log(`[CrossRef AI] Line ${i}:`, trimmedLine.substring(0, 60));

    // Normalize the line: convert full-width chars to half-width
    let normalized = trimmedLine
      .replace(/｜/g, '|')  // full-width pipe
      .replace(/：/g, ':')  // full-width colon
      .replace(/　/g, ' '); // full-width space

    // Remove leading number prefix like "1. " or "2. "
    normalized = normalized.replace(/^\d+\.\s*/, '');

    // Try to match the pipe format: 书卷名 章:节|说明
    // Handles both half-width and full-width characters
    const pipeMatch = normalized.match(/^(.+?)\s+(\d+):(\d+)\s*\|\s*(.+)$/);
    if (pipeMatch) {
      const bookName = pipeMatch[1].trim();
      const chapter = pipeMatch[2];
      const verse = pipeMatch[3];
      const ref = `${bookName} ${chapter}:${verse}`;
      const desc = pipeMatch[4].trim();
      console.log('[CrossRef AI] Matched pipe format:', ref, '|', desc);
      descriptions.set(ref, desc);
      continue;
    }

    // Try colon format: 书卷名 章:节: 说明
    const colonMatch = normalized.match(/^(.+?)\s+(\d+):(\d+)\s*:\s*(.+)$/);
    if (colonMatch) {
      const bookName = colonMatch[1].trim();
      const chapter = colonMatch[2];
      const verse = colonMatch[3];
      const ref = `${bookName} ${chapter}:${verse}`;
      const desc = colonMatch[4].trim();
      console.log('[CrossRef AI] Matched colon format:', ref, '|', desc);
      descriptions.set(ref, desc);
      continue;
    }

    // Try dash format: 书卷名 章:节 - 说明 (seen in logs)
    const dashMatch = normalized.match(/^(.+?)\s+(\d+):(\d+)\s*-\s*(.+)$/);
    if (dashMatch) {
      const bookName = dashMatch[1].trim();
      const chapter = dashMatch[2];
      const verse = dashMatch[3];
      const ref = `${bookName} ${chapter}:${verse}`;
      const desc = dashMatch[4].trim();
      console.log('[CrossRef AI] Matched dash format:', ref, '|', desc);
      descriptions.set(ref, desc);
    }
  }

  return descriptions;
}

/**
 * Generate a single connection description
 */
export async function generateSingleDescription(
  sourceVerse: SourceVerse,
  targetVerse: ConnectionForAI,
  apiConfig?: AIConfig
): Promise<string> {
  try {
    const model = await getAIModel(apiConfig);

    const { text } = await generateText({
      model,
      prompt: `请用不超过30字说明以下两段经文的关联：
源经文：${sourceVerse.bookName} ${sourceVerse.chapter}:${sourceVerse.verse} - ${sourceVerse.content.slice(0, 50)}
目标经文：${targetVerse.bookName} ${targetVerse.chapter}:${targetVerse.verse} - ${targetVerse.content.slice(0, 50)}
关联类型：${TYPE_LABELS[targetVerse.type]}

直接输出说明文字，不要其他内容：`,
      temperature: 0.3,
      maxTokens: 100,
    });

    return text.trim().slice(0, 50);
  } catch (error) {
    console.error('[CrossRef AI] Failed to generate single description:', error);
    return '';
  }
}