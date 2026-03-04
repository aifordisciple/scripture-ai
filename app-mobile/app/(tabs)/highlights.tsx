// app-mobile/app/(tabs)/highlights.tsx
// Highlights screen

import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getHighlights, HighlightData } from '@scripture-ai/core';
import { BIBLE_BOOKS } from '@scripture-ai/core';

export default function HighlightsScreen() {
  const router = useRouter();
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHighlights();
  }, []);

  const loadHighlights = async () => {
    try {
      const data = await getHighlights();
      setHighlights(data);
    } catch (error) {
      console.error('Failed to load highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBookName = (bookId: string) => {
    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    return book?.name || bookId;
  };

  const handleHighlightPress = (highlight: HighlightData) => {
    router.push(`/chapter/${highlight.bookId}/${highlight.chapter}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的收藏</Text>
        <Text style={styles.subtitle}>{highlights.length} 条高亮</Text>
      </View>

      {highlights.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>暂无收藏</Text>
          <Text style={styles.emptyText}>阅读经文时，长按选择经文即可收藏</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {highlights.map((highlight, index) => (
            <TouchableOpacity
              key={`${highlight.bookId}-${highlight.chapter}-${highlight.verse}-${index}`}
              style={[styles.highlightItem, { borderLeftColor: highlight.color }]}
              onPress={() => handleHighlightPress(highlight)}
            >
              <View style={styles.highlightHeader}>
                <Text style={styles.highlightRef}>
                  {getBookName(highlight.bookId)} {highlight.chapter}:{highlight.verse}
                </Text>
              </View>
              {highlight.content && (
                <Text style={styles.highlightContent} numberOfLines={2}>
                  {highlight.content}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 16,
  },
  highlightItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  highlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  highlightRef: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  highlightContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});
