// packages/core/src/bible/reader.ts
// Bible reader engine - shared between web and mobile

import { BibleVerse, VerseRef } from '../constants';

// API endpoints (can be overridden in mobile)
let API_BASE_URL = '/api';

export function setApiBaseUrl(url: string) {
  API_BASE_URL = url;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

// Fetch chapter
export async function fetchChapter(
  bookId: string, 
  chapter: number, 
  version: string = 'CUV'
): Promise<BibleVerse[]> {
  const response = await fetch(
    `${API_BASE_URL}/bible?book=${bookId}&chapter=${chapter}&version=${version}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch chapter');
  }
  const data = await response.json();
  return data.verses || [];
}

// Fetch verse
export async function fetchVerse(
  bookId: string, 
  chapter: number, 
  verse: number,
  version: string = 'CUV'
): Promise<BibleVerse | null> {
  const verses = await fetchChapter(bookId, chapter, version);
  return verses.find(v => v.verse === verse) || null;
}

// Format verse reference
export function formatVerseRef(ref: VerseRef, short: boolean = false): string {
  const bookNames: Record<string, string> = {
    'Gen': '创',
    'Exo': '出',
    'Lev': '利',
    'Num': '民',
    'Deu': '申',
    'Jos': '书',
    'Jdg': '士',
    'Rut': '得',
    '1Sa': '撒上',
    '2Sa': '撒下',
    '1Ki': '王上',
    '2Ki': '王下',
    '1Ch': '代上',
    '2Ch': '代下',
    'Ezr': '拉',
    'Neh': '尼',
    'Est': '斯',
    'Job': '伯',
    'Psa': '诗',
    'Pro': '箴',
    'Ecc': '传',
    'Sng': '歌',
    'Isa': '赛',
    'Jer': '耶',
    'Lam': '哀',
    'Eze': '结',
    'Dan': '但',
    'Hos': '何',
    'Jol': '珥',
    'Amo': '摩',
    'Oba': '俄',
    'Jon': '拿',
    'Mic': '弥',
    'Nah': '鸿',
    'Hab': '哈',
    'Zep': '番',
    'Hag': '该',
    'Zec': '亚',
    'Mal': '玛',
    'Mat': '太',
    'Mrk': '可',
    'Luk': '路',
    'Jhn': '约',
    'Act': '徒',
    'Rom': '罗',
    '1Co': '林前',
    '2Co': '林后',
    'Gal': '加',
    'Eph': '弗',
    'Php': '腓',
    'Col': '西',
    '1Th': '帖前',
    '2Th': '帖后',
    '1Ti': '提前',
    '2Ti': '提后',
    'Tit': '多',
    'Phm': '门',
    'Heb': '来',
    'Jas': '雅',
    '1Pe': '彼前',
    '2Pe': '彼后',
    '1Jn': '约一',
    '2Jn': '约二',
    '3Jn': '约三',
    'Jud': '犹',
    'Rev': '启',
  };
  
  const bookName = short ? (bookNames[ref.bookName] || ref.bookName) : ref.bookName;
  return `${ref.bookName} ${ref.chapter}:${ref.verse}`;
}

// Format verse range
export function formatVerseRange(verses: number[]): string {
  if (!verses || verses.length === 0) return '';
  
  const sorted = [...verses].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = sorted[i];
      prev = sorted[i];
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
}

// Get next chapter
export function getNextChapter(
  currentBookId: string, 
  currentChapter: number,
  books: { id: string; chapters: number }[]
): { bookId: string; chapter: number } | null {
  const currentBookIndex = books.findIndex(b => b.id === currentBookId);
  if (currentBookIndex === -1) return null;
  
  const currentBook = books[currentBookIndex];
  
  if (currentChapter < currentBook.chapters) {
    return { bookId: currentBookId, chapter: currentChapter + 1 };
  } else if (currentBookIndex < books.length - 1) {
    const nextBook = books[currentBookIndex + 1];
    return { bookId: nextBook.id, chapter: 1 };
  }
  
  return null;
}

// Get previous chapter
export function getPreviousChapter(
  currentBookId: string, 
  currentChapter: number,
  books: { id: string; chapters: number }[]
): { bookId: string; chapter: number } | null {
  const currentBookIndex = books.findIndex(b => b.id === currentBookId);
  if (currentBookIndex === -1) return null;
  
  if (currentChapter > 1) {
    return { bookId: currentBookId, chapter: currentChapter - 1 };
  } else if (currentBookIndex > 0) {
    const prevBook = books[currentBookIndex - 1];
    return { bookId: prevBook.id, chapter: prevBook.chapters };
  }
  
  return null;
}
