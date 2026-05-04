/**
 * Sermon Markdown utilities
 * Handles parsing and generating sermon-specific Markdown syntax
 */

/** Verse block parsed from ```verse:Reference ... ``` */
export interface VerseBlock {
  type: 'verse';
  reference: string;
  text: string;
}

/** Section block parsed from ```section:type ... ``` */
export interface SectionBlock {
  type: 'section';
  sectionType: string;
  content: string;
}

export type SermonBlock = VerseBlock | SectionBlock;

/** Section types for sermon sections */
export const SECTION_TYPES = [
  'introduction',
  'main_point',
  'sub_point',
  'illustration',
  'application',
  'conclusion',
  'prayer',
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

/** Generate a verse fenced block */
export function generateVerseBlock(reference: string, text: string): string {
  return `\`\`\`verse:${reference}\n${text}\n\`\`\``;
}

/** Generate a section fenced block */
export function generateSectionBlock(sectionType: SectionType, content: string): string {
  return `\`\`\`section:${sectionType}\n${content}\n\`\`\``;
}

/** Parse a verse fenced block, returns null if not a verse block */
export function parseVerseBlock(line: string): { reference: string } | null {
  const match = line.match(/^```verse:(.+)$/);
  if (!match) return null;
  return { reference: match[1].trim() };
}

/** Parse a section fenced block, returns null if not a section block */
export function parseSectionBlock(line: string): { sectionType: string } | null {
  const match = line.match(/^```section:(.+)$/);
  if (!match) return null;
  return { sectionType: match[1].trim() };
}

/** Generate excerpt from Markdown content (first ~200 chars of plain text) */
export function generateExcerpt(markdown: string, maxLength: number = 200): string {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, '') // remove fenced blocks
    .replace(/#{1,6}\s+/g, '')       // remove headings
    .replace(/\*\*|__|_|\*|~~/g, '') // remove emphasis
    .replace(/>\s+/g, '')             // remove blockquotes
    .replace(/[-*+]\s+/g, '')         // remove list markers
    .replace(/\d+\.\s+/g, '')         // remove ordered list markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links to text
    .replace(/\n{2,}/g, ' ')          // double newlines to space
    .replace(/\n/g, ' ')              // single newlines to space
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return plainText.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

/** Check if content is Tiptap JSON (legacy format from before CodeMirror migration) */
export function isTiptapJson(content: string): boolean {
  const trimmed = content.trimStart();
  // Check for the standard Tiptap document root signature
  // A simple '{' check is too broad and would match any JSON-like content
  return trimmed.startsWith('{"type":"doc"') || trimmed.startsWith('{ "type": "doc"');
}
