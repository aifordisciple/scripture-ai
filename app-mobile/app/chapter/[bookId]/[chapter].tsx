// app-mobile/app/chapter/[bookId]/[chapter].tsx
// Chapter reading screen

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchChapter, getNextChapter, getPreviousChapter } from '@scripture-ai/core';
import { BIBLE_BOOKS, BibleVerse } from '@scripture-ai/core/src/constants';

export default function ChapterScreen() {
  const { bookId, chapter } = useLocalSearchParams<{ bookId: string; chapter: string }>();
  const router = useRouter();
  
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chapterNum = parseInt(chapter || '1');
  const book = BIBLE_BOOKS.find(b => b.id === bookId);

  useEffect(() => {
    loadChapter();
  }, [bookId, chapter]);

  const loadChapter = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChapter(bookId!, chapterNum);
      setVerses(data);
    } catch (err) {
      setError('加载经文失败，请检查网络连接');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    const prev = getPreviousChapter(bookId!, chapterNum, BIBLE_BOOKS);
    if (prev) {
      router.replace(`/chapter/${prev.bookId}/${prev.chapter}`);
    }
  };

  const handleNext = () => {
    const next = getNextChapter(bookId!, chapterNum, BIBLE_BOOKS);
    if (next) {
      router.replace(`/chapter/${next.bookId}/${next.chapter}`);
    }
  };

  const handleVerseLongPress = (verse: BibleVerse) => {
    // TODO: Show highlight/note menu
    console.log('Long press verse:', verse);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadChapter}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasPrev = getPreviousChapter(bookId!, chapterNum, BIBLE_BOOKS);
  const hasNext = getNextChapter(bookId!, chapterNum, BIBLE_BOOKS);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.bookName}>{book?.name || bookId}</Text>
        <Text style={styles.chapterNumber}>第 {chapterNum} 章</Text>
      </View>

      {/* Verses */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {verses.map((verse) => (
          <TouchableOpacity
            key={verse.id}
            style={styles.verseItem}
            onLongPress={() => handleVerseLongPress(verse)}
            activeOpacity={0.7}
          >
            <Text style={styles.verseNumber}>{verse.verse}</Text>
            <Text style={styles.verseText}>{verse.content}</Text>
          </TouchableOpacity>
        ))}
        
        {/* Chapter end marker */}
        <View style={styles.chapterEnd}>
          <Text style={styles.chapterEndText}>— 圣经 · {book?.name} {chapterNum} 章 —</Text>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, !hasPrev && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={!hasPrev}
        >
          <Text style={[styles.navButtonText, !hasPrev && styles.navButtonTextDisabled]}>
            上一章
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={() => router.back()}>
          <Text style={styles.homeButtonText}>目录</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, !hasNext && styles.navButtonDisabled]}
          onPress={handleNext}
          disabled={!hasNext}
        >
          <Text style={[styles.navButtonText, !hasNext && styles.navButtonTextDisabled]}>
            下一章
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  bookName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  chapterNumber: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  verseItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    width: 32,
  },
  verseText: {
    flex: 1,
    fontSize: 17,
    lineHeight: 28,
    color: '#1e293b',
  },
  chapterEnd: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  chapterEndText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },
  navButtonTextDisabled: {
    color: '#94a3b8',
  },
  homeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginHorizontal: 12,
  },
  homeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
});
