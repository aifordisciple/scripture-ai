// apps/desktop/src/utils/verseRefParser.ts
/**
 * Verse reference parser for desktop app
 *
 * Parses verse references in various formats:
 * - "John 3:16" or "约翰福音 3:16"
 * - "创世记 1" or "Gen 1"
 * - "诗篇 23:1-6" or "Ps 23:1-6"
 */

// Book name mappings
const BOOK_ALIASES: Record<string, string> = {
  // Old Testament - English
  'gen': 'gen', 'genesis': 'gen',
  'exod': 'exod', 'exodus': 'exod', 'ex': 'exod',
  'lev': 'lev', 'leviticus': 'lev',
  'num': 'num', 'numbers': 'num',
  'deut': 'deut', 'deuteronomy': 'deut', 'dt': 'deut',
  'josh': 'josh', 'joshua': 'josh',
  'judg': 'judg', 'judges': 'judg',
  'ruth': 'ruth',
  '1sam': '1sam', '1samuel': '1sam', '1sa': '1sam',
  '2sam': '2sam', '2samuel': '2sam', '2sa': '2sam',
  '1kgs': '1kgs', '1kings': '1kgs', '1ki': '1kgs',
  '2kgs': '2kgs', '2kings': '2kgs', '2ki': '2kgs',
  '1chr': '1chr', '1chronicles': '1chr', '1ch': '1chr',
  '2chr': '2chr', '2chronicles': '2chr', '2ch': '2chr',
  'ezra': 'ezra',
  'neh': 'neh', 'nehemiah': 'neh',
  'esth': 'esth', 'esther': 'esth',
  'job': 'job',
  'ps': 'ps', 'psa': 'ps', 'psalms': 'ps', 'psalm': 'ps',
  'prov': 'prov', 'proverbs': 'prov', 'pr': 'prov',
  'eccl': 'eccl', 'ecclesiastes': 'eccl', 'ecc': 'eccl',
  'song': 'song', 'songofsolomon': 'song', 'sos': 'song',
  'isa': 'isa', 'isaiah': 'isa',
  'jer': 'jer', 'jeremiah': 'jer',
  'lam': 'lam', 'lamentations': 'lam',
  'ezek': 'ezek', 'ezekiel': 'ezek',
  'dan': 'dan', 'daniel': 'dan',
  'hos': 'hos', 'hosea': 'hos',
  'joel': 'joel',
  'amos': 'amos',
  'obad': 'obad', 'obadiah': 'obad',
  'jonah': 'jonah',
  'mic': 'mic', 'micah': 'mic',
  'nah': 'nah', 'nahum': 'nah',
  'hab': 'hab', 'habakkuk': 'hab',
  'zeph': 'zeph', 'zephaniah': 'zeph',
  'hag': 'hag', 'haggai': 'hag',
  'zech': 'zech', 'zechariah': 'zech',
  'mal': 'mal', 'malachi': 'mal',
  // New Testament - English
  'mat': 'mat', 'matthew': 'mat', 'mt': 'mat',
  'mark': 'mark', 'mk': 'mark',
  'luke': 'luke', 'lk': 'luke',
  'john': 'john', 'jn': 'john',
  'acts': 'acts',
  'rom': 'rom', 'romans': 'rom',
  '1cor': '1cor', '1corinthians': '1cor',
  '2cor': '2cor', '2corinthians': '2cor',
  'gal': 'gal', 'galatians': 'gal',
  'eph': 'eph', 'ephesians': 'eph',
  'phil': 'phil', 'philippians': 'phil',
  'col': 'col', 'colossians': 'col',
  '1thess': '1thess', '1thessalonians': '1thess',
  '2thess': '2thess', '2thessalonians': '2thess',
  '1tim': '1tim', '1timothy': '1tim',
  '2tim': '2tim', '2timothy': '2tim',
  'titus': 'titus',
  'phlm': 'phlm', 'philemon': 'phlm',
  'heb': 'heb', 'hebrews': 'heb',
  'jas': 'jas', 'james': 'jas',
  '1pet': '1pet', '1peter': '1pet',
  '2pet': '2pet', '2peter': '2pet',
  '1john': '1john', '1jn': '1john',
  '2john': '2john', '2jn': '2john',
  '3john': '3john', '3jn': '3john',
  'jude': 'jude',
  'rev': 'rev', 'revelation': 'rev',

  // Old Testament - Chinese
  '创世记': 'gen', '创': 'gen',
  '出埃及记': 'exod', '出': 'exod',
  '利未记': 'lev', '利': 'lev',
  '民数记': 'num', '民': 'num',
  '申命记': 'deut', '申': 'deut',
  '约书亚记': 'josh', '书': 'josh',
  '士师记': 'judg', '士': 'judg',
  '路得记': 'ruth', '得': 'ruth',
  '撒母耳记上': '1sam', '撒上': '1sam',
  '撒母耳记下': '2sam', '撒下': '2sam',
  '列王纪上': '1kgs', '王上': '1kgs',
  '列王纪下': '2kgs', '王下': '2kgs',
  '历代志上': '1chr', '代上': '1chr',
  '历代志下': '2chr', '代下': '2chr',
  '以斯拉记': 'ezra', '拉': 'ezra',
  '尼希米记': 'neh', '尼': 'neh',
  '以斯帖记': 'esth', '斯': 'esth',
  '约伯记': 'job', '伯': 'job',
  '诗篇': 'ps', '诗': 'ps',
  '箴言': 'prov', '箴': 'prov',
  '传道书': 'eccl', '传': 'eccl',
  '雅歌': 'song', '歌': 'song',
  '以赛亚书': 'isa', '赛': 'isa',
  '耶利米书': 'jer', '耶': 'jer',
  '耶利米哀歌': 'lam', '哀': 'lam',
  '以西结书': 'ezek', '结': 'ezek',
  '但以理书': 'dan', '但': 'dan',
  '何西阿书': 'hos', '何': 'hos',
  '约珥书': 'joel', '珥': 'joel',
  '阿摩司书': 'amos', '摩': 'amos',
  '俄巴底亚书': 'obad', '俄': 'obad',
  '约拿书': 'jonah', '拿': 'jonah',
  '弥迦书': 'mic', '弥': 'mic',
  '那鸿书': 'nah', '鸿': 'nah',
  '哈巴谷书': 'hab', '哈': 'hab',
  '西番雅书': 'zeph', '番': 'zeph',
  '哈该书': 'hag', '该': 'hag',
  '撒迦利亚书': 'zech', '亚': 'zech',
  '玛拉基书': 'mal', '玛': 'mal',
  // New Testament - Chinese
  '马太福音': 'mat', '太': 'mat',
  '马可福音': 'mark', '可': 'mark',
  '路加福音': 'luke', '路': 'luke',
  '约翰福音': 'john', '约': 'john',
  '使徒行传': 'acts', '徒': 'acts',
  '罗马书': 'rom', '罗': 'rom',
  '哥林多前书': '1cor', '林前': '1cor',
  '哥林多后书': '2cor', '林后': '2cor',
  '加拉太书': 'gal', '加': 'gal',
  '以弗所书': 'eph', '弗': 'eph',
  '腓立比书': 'phil', '腓': 'phil',
  '歌罗西书': 'col', '西': 'col',
  '帖撒罗尼迦前书': '1thess', '帖前': '1thess',
  '帖撒罗尼迦后书': '2thess', '帖后': '2thess',
  '提摩太前书': '1tim', '提前': '1tim',
  '提摩太后书': '2tim', '提后': '2tim',
  '提多书': 'titus', '多': 'titus',
  '腓利门书': 'phlm', '门': 'phlm',
  '希伯来书': 'heb', '来': 'heb',
  '雅各书': 'jas', '雅': 'jas',
  '彼得前书': '1pet', '彼前': '1pet',
  '彼得后书': '2pet', '彼后': '2pet',
  '约翰一书': '1john', '约一': '1john',
  '约翰二书': '2john', '约二': '2john',
  '约翰三书': '3john', '约三': '3john',
  '犹大书': 'jude', '犹': 'jude',
  '启示录': 'rev', '启': 'rev',
};

export interface ParsedReference {
  bookId: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  isValid: boolean;
  error?: string;
}

/**
 * Parse a verse reference string
 *
 * @param input - The reference string to parse
 * @returns ParsedReference object with book, chapter, and verse info
 *
 * @example
 * parseVerseRef("John 3:16") // { bookId: 'john', chapter: 3, verseStart: 16, isValid: true }
 * parseVerseRef("创世记 1") // { bookId: 'gen', chapter: 1, isValid: true }
 * parseVerseRef("诗篇 23:1-6") // { bookId: 'ps', chapter: 23, verseStart: 1, verseEnd: 6, isValid: true }
 */
export function parseVerseRef(input: string): ParsedReference {
  const trimmed = input.trim();

  if (!trimmed) {
    return { bookId: '', chapter: 0, isValid: false, error: '空引用' };
  }

  // Try to match various patterns
  // Pattern 1: "Book Chapter:Verse-Verse" or "Book Chapter:Verse"
  // Pattern 2: "Book Chapter" (no verse)
  // Pattern 3: Chinese format "书卷 章节"

  // Try with colon separator (English style)
  const colonPattern = /^(.+?)\s*(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?$/;
  let match = trimmed.match(colonPattern);

  if (match) {
    const [, bookPart, chapter, verseStart, verseEnd] = match;
    const bookId = resolveBookId(bookPart);

    if (bookId) {
      return {
        bookId,
        chapter: parseInt(chapter),
        verseStart: parseInt(verseStart),
        verseEnd: verseEnd ? parseInt(verseEnd) : undefined,
        isValid: true,
      };
    }
  }

  // Try without colon (just book and chapter)
  const chapterOnlyPattern = /^(.+?)\s*(\d+)$/;
  match = trimmed.match(chapterOnlyPattern);

  if (match) {
    const [, bookPart, chapter] = match;
    const bookId = resolveBookId(bookPart);

    if (bookId) {
      return {
        bookId,
        chapter: parseInt(chapter),
        isValid: true,
      };
    }
  }

  // Try Chinese format with colon
  const chinesePattern = /^(.+?)(\d+)\s*[:：]\s*(\d+)(?:\s*[-~—]\s*(\d+))?$/;
  match = trimmed.match(chinesePattern);

  if (match) {
    const [, bookPart, chapter, verseStart, verseEnd] = match;
    const bookId = resolveBookId(bookPart);

    if (bookId) {
      return {
        bookId,
        chapter: parseInt(chapter),
        verseStart: parseInt(verseStart),
        verseEnd: verseEnd ? parseInt(verseEnd) : undefined,
        isValid: true,
      };
    }
  }

  // Try Chinese format without colon
  const chineseChapterOnlyPattern = /^(.+?)(\d+)$/;
  match = trimmed.match(chineseChapterOnlyPattern);

  if (match) {
    const [, bookPart, chapter] = match;
    const bookId = resolveBookId(bookPart);

    if (bookId) {
      return {
        bookId,
        chapter: parseInt(chapter),
        isValid: true,
      };
    }
  }

  return {
    bookId: '',
    chapter: 0,
    isValid: false,
    error: `无法解析引用: "${input}"`,
  };
}

/**
 * Resolve a book name to its ID
 */
function resolveBookId(name: string): string | null {
  const normalized = name.trim().toLowerCase();
  return BOOK_ALIASES[normalized] || null;
}

/**
 * Format a verse reference for display
 */
export function formatVerseRef(
  bookId: string,
  chapter: number,
  verseStart?: number,
  verseEnd?: number
): string {
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

  const bookName = BOOK_NAMES[bookId] || bookId;

  if (verseStart !== undefined) {
    if (verseEnd !== undefined && verseEnd !== verseStart) {
      return `${bookName} ${chapter}:${verseStart}-${verseEnd}`;
    }
    return `${bookName} ${chapter}:${verseStart}`;
  }

  return `${bookName} ${chapter}`;
}