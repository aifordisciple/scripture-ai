/**
 * Tiptap JSON → Markdown converter
 * Converts Tiptap ProseMirror JSON to sermon Markdown format
 */

import { generateVerseBlock, generateSectionBlock } from './sermon-markdown';

interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

interface TiptapDoc {
  type: string;
  content?: TiptapNode[];
}

/** Convert a Tiptap JSON document to Markdown string */
export function tiptapToMarkdown(json: string | TiptapDoc): string {
  let doc: TiptapDoc;
  if (typeof json === 'string') {
    try {
      doc = JSON.parse(json);
    } catch {
      return json; // Not valid JSON, return as-is
    }
  } else {
    doc = json;
  }

  if (!doc.content) return '';
  return doc.content.map(node => convertNode(node)).join('\n\n');
}

/** Convert a single Tiptap node to Markdown */
function convertNode(node: TiptapNode, indent: number = 0): string {
  switch (node.type) {
    case 'doc':
      return node.content ? node.content.map(n => convertNode(n)).join('\n\n') : '';

    case 'heading': {
      const level = (node.attrs?.level as number) || 1;
      const text = extractText(node);
      return `${'#'.repeat(level)} ${text}`;
    }

    case 'paragraph': {
      const text = convertInlineContent(node);
      return text || '';
    }

    case 'bulletList': {
      return node.content
        ? node.content.map(n => convertNode(n, indent)).join('\n')
        : '';
    }

    case 'orderedList': {
      return node.content
        ? node.content.map((n, i) => convertListItem(n, i + 1, indent)).join('\n')
        : '';
    }

    case 'listItem': {
      return convertListItem(node, undefined, indent);
    }

    case 'blockquote': {
      const text = node.content
        ? node.content.map(n => convertNode(n)).join('\n')
        : '';
      return text.split('\n').map(l => `> ${l}`).join('\n');
    }

    case 'horizontalRule':
      return '---';

    case 'verseBlock': {
      const reference = (node.attrs?.reference as string) || '';
      const text = (node.attrs?.text as string) || extractText(node);
      return generateVerseBlock(reference, text);
    }

    case 'sectionHeading': {
      const sectionType = (node.attrs?.sectionType as string) || 'introduction';
      const text = extractText(node);
      return generateSectionBlock(sectionType as any, text);
    }

    case 'codeBlock': {
      const language = (node.attrs?.language as string) || '';
      const text = extractText(node);
      return `\`\`\`${language}\n${text}\n\`\`\``;
    }

    case 'hardBreak':
      return '  \n';

    default:
      // Unknown block node - try to extract text
      if (node.content) {
        return node.content.map(n => convertNode(n, indent)).join('\n\n');
      }
      return extractText(node);
  }
}

/** Convert inline content (paragraph with marks) */
function convertInlineContent(node: TiptapNode): string {
  if (!node.content) return '';

  return node.content.map(inlineNode => {
    if (inlineNode.type === 'text' && inlineNode.text) {
      let text = inlineNode.text;
      if (inlineNode.marks) {
        for (const mark of inlineNode.marks) {
          switch (mark.type) {
            case 'bold':
              text = `**${text}**`;
              break;
            case 'italic':
              text = `*${text}*`;
              break;
            case 'strike':
              text = `~~${text}~~`;
              break;
            case 'code':
              text = `\`${text}\``;
              break;
            case 'link':
              text = `[${text}](${mark.attrs?.href || ''})`;
              break;
            case 'highlight': {
              const color = mark.attrs?.color as string;
              if (color) {
                text = `==${text}==`;
              }
              break;
            }
          }
        }
      }
      return text;
    }
    if (inlineNode.type === 'hardBreak') return '  \n';
    return '';
  }).join('');
}

/** Extract plain text from a node tree */
function extractText(node: TiptapNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(n => extractText(n)).join('');
}

/** Convert a list item to Markdown */
function convertListItem(node: TiptapNode, number?: number, indent: number = 0): string {
  const prefix = '  '.repeat(indent);
  const text = node.content
    ? node.content
        .filter(n => n.type !== 'bulletList' && n.type !== 'orderedList')
        .map(n => convertNode(n))
        .join(' ')
    : '';

  // Check for nested lists
  const nestedLists = node.content?.filter(
    n => n.type === 'bulletList' || n.type === 'orderedList'
  );

  let result = number
    ? `${prefix}${number}. ${text}`
    : `${prefix}- ${text}`;

  if (nestedLists) {
    for (const nested of nestedLists) {
      result += '\n' + convertNode(nested, indent + 1);
    }
  }

  return result;
}
