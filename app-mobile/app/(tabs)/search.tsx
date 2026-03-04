// app-mobile/app/(tabs)/search.tsx
// Search screen

import { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { search, SearchMode } from '@scripture-ai/core';
import { BibleVerse } from '@scripture-ai/core/src/constants';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BibleVerse[]>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>('exact');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const result = await search(query, { mode: searchMode });
      setResults(result.verses);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVersePress = (verse: BibleVerse) => {
    router.push(`/chapter/${verse.bookId}/${verse.chapter}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>搜索经文</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="输入经文关键词..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>搜索</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeSelector}>
        {(['exact', 'ai', 'fuzzy'] as SearchMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeButton, searchMode === mode && styles.modeButtonActive]}
            onPress={() => setSearchMode(mode)}
          >
            <Text style={[styles.modeButtonText, searchMode === mode && styles.modeButtonTextActive]}>
              {mode === 'exact' ? '精确' : mode === 'ai' ? '智能' : '模糊'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => `${item.bookId}-${item.chapter}-${item.verse}`}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.resultItem} onPress={() => handleVersePress(item)}>
            <Text style={styles.resultRef}>
              {item.bookName} {item.chapter}:{item.verse}
            </Text>
            <Text style={styles.resultContent} numberOfLines={2}>
              {item.content}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {loading ? '搜索中...' : '输入关键词搜索圣经'}
            </Text>
          </View>
        }
      />
    </View>
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
  searchBox: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  modeButtonActive: {
    backgroundColor: '#0f172a',
  },
  modeButtonText: {
    color: '#64748b',
    fontSize: 14,
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  resultsList: {
    paddingHorizontal: 16,
  },
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  resultRef: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  resultContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
  },
});
