/**
 * AI response utilities — shared helpers for cleaning AI model output.
 */

const THINK_TAG_REGEX = /<think>[\s\S]*?<\/think>/gi;
const THINKING_TAG_REGEX = /<thinking>[\s\S]*?<\/thinking>/gi;
const REASONING_TAG_REGEX = /<reasoning>[\s\S]*?<\/reasoning>/gi;

/**
 * Strip `<think>...</think>` tags and their content from AI responses.
 * Used by frontend components to clean display text.
 */
export function stripThinkTags(content: string): string {
  return content.replace(THINK_TAG_REGEX, '').trim();
}

/**
 * Strip all AI thinking/reasoning blocks from API responses.
 * Handles `<think>`, `<thinking>`, and `<reasoning>` tags.
 * Used by API routes to clean AI output before parsing.
 */
export function stripAllThinkTags(text: string): string {
  return text
    .replace(THINK_TAG_REGEX, '')
    .replace(THINKING_TAG_REGEX, '')
    .replace(REASONING_TAG_REGEX, '');
}

/**
 * Parse think tags from AI responses, returning both the cleaned text
 * and whether the response contains an active thinking block.
 * Used by message list components for UI display.
 */
export function parseThinkTags(content: string): {
  displayText: string;
  isThinking: boolean;
} {
  const openIdx = content.indexOf('<think>');
  const closeIdx = content.indexOf('</think>');

  if (openIdx === -1) {
    return { displayText: content, isThinking: false };
  }

  if (closeIdx === -1) {
    // Still thinking — show text after <think> as thinking indicator
    const afterThink = content.slice(openIdx + 7).trim();
    return { displayText: afterThink, isThinking: true };
  }

  // Think block complete — strip it
  const cleaned = content.replace(THINK_TAG_REGEX, '').trim();
  return { displayText: cleaned, isThinking: false };
}
