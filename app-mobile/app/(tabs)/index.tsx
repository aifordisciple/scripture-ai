// app-mobile/app/(tabs)/index.tsx
// Main reading screen

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BIBLE_BOOKS } from '@scripture-ai/core';

// Book category groups
const BOOK_CATEGORIES = [
  { name: '旧约', books: BIBLE_BOOKS.filter(b => b.category === '律法书' || b.category === '历史书') },
  { name: '诗篇智慧', books: BIBLE_BOOKS.filter(b => b.category === '智慧文学') },
  { name: '先知书', books: BIBLE_BOOKS.filter(b => b.category === '大先知书' || b.category === '小先知书') },
  { name: '福音书', books: BIBLE_BOOKS.filter(b => b.category === '福音书' || b.category === '历史书') },
  { name: '书信', books: BIBLE_BOOKS.filter(b => b.category === '保罗书信' || b.category === '普通书信') },
  { name: '启示录', books: BIBLE_BOOKS.filter(b => b.category === '预言书') },
];

export default function ReadingScreen() {
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  const handleBookPress = (bookId: string) => {
    router.push(`/chapter/${bookId}/1`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>圣经目录</Text>
        <Text style={styles.subtitle}>选择书卷开始阅读</Text>
      </View>

      {BOOK_CATEGORIES.map((category) => (
        <View key={category.name} style={styles.category}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          <View style={styles.booksGrid}>
            {category.books.map((book) => (
              <TouchableOpacity
                key={book.id}
                style={[
                  styles.bookItem,
                  selectedBook === book.id && styles.bookItemSelected
                ]}
                onPress={() => handleBookPress(book.id)}
              >
                <Text 
                  style={[
                    styles.bookName,
                    selectedBook === book.id && styles.bookNameSelected
                  ]}
                  numberOfLines={1}
                >
                  {book.name}
                </Text>
                <Text style={styles.bookChapters}>{book.chapters}章</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

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
  category: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bookItem: {
    width: '47%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  bookItemSelected: {
    backgroundColor: '#0f172a',
  },
  bookName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },
  bookNameSelected: {
    color: '#ffffff',
  },
  bookChapters: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});
