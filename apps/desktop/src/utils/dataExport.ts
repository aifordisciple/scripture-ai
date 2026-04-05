// apps/desktop/src/utils/dataExport.ts
/**
 * Data export utilities for desktop app
 *
 * Export user data (highlights, notes, bookmarks) to various formats
 */

import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

export interface ExportData {
  version: string;
  exportDate: string;
  user: {
    id: string;
    email?: string;
  };
  highlights: ExportHighlight[];
  notes: ExportNote[];
  bookmarks: ExportBookmark[];
  readingHistory: ExportHistory[];
  chatSessions: ExportChatSession[];
}

export interface ExportHighlight {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  color: string;
  text?: string;
  createdAt: string;
}

export interface ExportNote {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExportBookmark {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse?: number;
  createdAt: string;
}

export interface ExportHistory {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  readAt: string;
  duration?: number;
}

export interface ExportChatSession {
  id: string;
  title: string;
  mode: string;
  createdAt: string;
  messages: {
    role: string;
    content: string;
    createdAt: string;
  }[];
}

// Book name mapping
const BOOK_NAMES: Record<string, string> = {
  gen: '创世记', exod: '出埃及记', lev: '利未记', num: '民数记', deut: '申命记',
  josh: '约书亚记', judg: '士师记', ruth: '路得记', '1sam': '撒母耳记上', '2sam': '撒母耳记下',
  '1kgs': '列王纪上', '2kgs': '列王纪下', '1chr': '历代志上', '2chr': '历代志下',
  ezra: '以斯拉记', neh: '尼希米记', esth: '以斯帖记', job: '约伯记', ps: '诗篇',
  prov: '箴言', eccl: '传道书', song: '雅歌', isa: '以赛亚书', jer: '耶利米书',
  lam: '耶利米哀歌', ezek: '以西结书', dan: '但以理书', hos: '何西阿书',
  joel: '约珥书', amos: '阿摩司书', obad: '俄巴底亚书', jonah: '约拿书',
  mic: '弥迦书', nah: '那鸿书', hab: '哈巴谷书', zeph: '西番雅书',
  hag: '哈该书', zech: '撒迦利亚书', mal: '玛拉基书',
  mat: '马太福音', mark: '马可福音', luke: '路加福音', john: '约翰福音',
  acts: '使徒行传', rom: '罗马书', '1cor': '哥林多前书', '2cor': '哥林多后书',
  gal: '加拉太书', eph: '以弗所书', phil: '腓立比书', col: '歌罗西书',
  '1thess': '帖撒罗尼迦前书', '2thess': '帖撒罗尼迦后书',
  '1tim': '提摩太前书', '2tim': '提摩太后书', titus: '提多书',
  phlm: '腓利门书', heb: '希伯来书', jas: '雅各书',
  '1pet': '彼得前书', '2pet': '彼得后书', '1john': '约翰一书',
  '2john': '约翰二书', '3john': '约翰三书', jude: '犹大书', rev: '启示录',
};

function getBookName(bookId: string): string {
  return BOOK_NAMES[bookId] || bookId;
}

/**
 * Export all user data
 */
export async function exportAllData(userId: string): Promise<ExportData | null> {
  try {
    // Fetch all data
    const [highlights, notes, bookmarks, history, sessions] = await Promise.all([
      invoke<any[]>('db_get_highlights', { userId }).catch(() => []),
      invoke<any[]>('db_get_notes', { userId }).catch(() => []),
      invoke<any[]>('db_get_bookmarks', { userId }).catch(() => []),
      invoke<any[]>('db_get_reading_history', { userId }).catch(() => []),
      invoke<any[]>('db_get_chat_sessions', { userId }).catch(() => []),
    ]);

    // Fetch messages for each session
    const sessionsWithMessages = await Promise.all(
      sessions.map(async (session) => {
        const messages = await invoke<any[]>('db_get_chat_messages', { sessionId: session.id })
          .catch(() => []);
        return {
          id: session.id,
          title: session.title,
          mode: session.mode,
          createdAt: session.created_at,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            createdAt: m.created_at,
          })),
        };
      })
    );

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      user: {
        id: userId,
      },
      highlights: highlights.map(h => ({
        id: h.id,
        bookId: h.book_id,
        bookName: getBookName(h.book_id),
        chapter: h.chapter,
        verseStart: h.verse_start,
        verseEnd: h.verse_end,
        color: h.color,
        createdAt: h.created_at,
      })),
      notes: notes.map(n => ({
        id: n.id,
        bookId: n.book_id,
        bookName: getBookName(n.book_id),
        chapter: n.chapter,
        verseStart: n.verse_start,
        verseEnd: n.verse_end,
        content: n.content,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      })),
      bookmarks: bookmarks.map(b => ({
        id: b.id,
        bookId: b.book_id,
        bookName: getBookName(b.book_id),
        chapter: b.chapter,
        verse: b.verse,
        createdAt: b.created_at,
      })),
      readingHistory: history.map(h => ({
        id: h.id,
        bookId: h.book_id,
        bookName: getBookName(h.book_id),
        chapter: h.chapter,
        readAt: h.read_at,
        duration: h.duration,
      })),
      chatSessions: sessionsWithMessages,
    };
  } catch (error) {
    console.error('Failed to export data:', error);
    return null;
  }
}

/**
 * Export data to JSON file
 */
export async function exportToJson(data: ExportData): Promise<boolean> {
  try {
    const filePath = await save({
      defaultPath: `ai读-数据导出-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (!filePath) return false;

    const content = JSON.stringify(data, null, 2);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);

    await writeFile(filePath, bytes);
    return true;
  } catch (error) {
    console.error('Failed to save JSON file:', error);
    return false;
  }
}

/**
 * Export highlights to markdown
 */
export async function exportHighlightsToMarkdown(highlights: ExportHighlight[]): Promise<string> {
  const lines: string[] = [
    '# 我的经文高亮',
    '',
    `导出时间: ${new Date().toLocaleString('zh-CN')}`,
    '',
    '---',
    '',
  ];

  // Group by book
  const grouped = highlights.reduce((acc, h) => {
    const key = `${h.bookName} ${h.chapter}章`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(h);
    return acc;
  }, {} as Record<string, ExportHighlight[]>);

  for (const [chapter, chapterHighlights] of Object.entries(grouped)) {
    lines.push(`## ${chapter}`);
    lines.push('');

    for (const h of chapterHighlights) {
      const verseRange = h.verseStart === h.verseEnd
        ? `${h.verseStart}节`
        : `${h.verseStart}-${h.verseEnd}节`;

      lines.push(`- **${verseRange}** <span style="background-color: ${h.color}; padding: 2px 6px; border-radius: 4px;">${h.color}</span>`);
      if (h.text) {
        lines.push(`  > ${h.text}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Export notes to markdown
 */
export async function exportNotesToMarkdown(notes: ExportNote[]): Promise<string> {
  const lines: string[] = [
    '# 我的笔记',
    '',
    `导出时间: ${new Date().toLocaleString('zh-CN')}`,
    '',
    '---',
    '',
  ];

  // Group by book
  const grouped = notes.reduce((acc, n) => {
    const key = n.bookName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {} as Record<string, ExportNote[]>);

  for (const [book, bookNotes] of Object.entries(grouped)) {
    lines.push(`## ${book}`);
    lines.push('');

    for (const n of bookNotes) {
      const verseRange = n.verseEnd
        ? `${n.verseStart}-${n.verseEnd}节`
        : `${n.verseStart}节`;

      lines.push(`### ${n.chapter}章 ${verseRange}`);
      lines.push('');
      lines.push(n.content);
      lines.push('');
      lines.push(`*创建于: ${new Date(n.createdAt).toLocaleString('zh-CN')}*`);
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Save markdown to file
 */
export async function exportToMarkdown(content: string, filename: string): Promise<boolean> {
  try {
    const filePath = await save({
      defaultPath: filename,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });

    if (!filePath) return false;

    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);

    await writeFile(filePath, bytes);
    return true;
  } catch (error) {
    console.error('Failed to save markdown file:', error);
    return false;
  }
}