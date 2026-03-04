// app-mobile/app/(tabs)/offline.tsx
// Offline Bible caching screen

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ProgressBar } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

interface DownloadItem {
  id: string;
  bookName: string;
  chapters: number;
  downloadedChapters: number;
  size: string;
  status: 'not_started' | 'downloading' | 'completed' | 'error';
}

const BOOKS_TO_DOWNLOAD: DownloadItem[] = [
  { id: 'gen', bookName: '创世记', chapters: 50, downloadedChapters: 0, size: '2.1 MB', status: 'not_started' },
  { id: 'exo', bookName: '出埃及记', chapters: 40, downloadedChapters: 0, size: '1.8 MB', status: 'not_started' },
  { id: 'lev', bookName: '利未记', chapters: 27, downloadedChapters: 0, size: '1.2 MB', status: 'not_started' },
  { id: 'num', bookName: '民数记', chapters: 36, downloadedChapters: 0, size: '1.5 MB', status: 'not_started' },
  { id: 'deu', bookName: '申命记', chapters: 34, downloadedChapters: 0, size: '1.4 MB', status: 'not_started' },
  { id: 'jos', bookName: '约书亚记', chapters: 24, downloadedChapters: 0, size: '1.1 MB', status: 'not_started' },
  { id: 'jdg', bookName: '士师记', chapters: 21, downloadedChapters: 0, size: '1.0 MB', status: 'not_started' },
  { id: 'rut', bookName: '路得记', chapters: 4, downloadedChapters: 0, size: '0.2 MB', status: 'not_started' },
  { id: '1sa', bookName: '撒母耳记上', chapters: 31, downloadedChapters: 0, size: '1.3 MB', status: 'not_started' },
  { id: '2sa', bookName: '撒母耳记下', chapters: 24, downloadedChapters: 0, size: '1.1 MB', status: 'not_started' },
  { id: '1ki', bookName: '列王纪上', chapters: 22, downloadedChapters: 0, size: '1.2 MB', status: 'not_started' },
  { id: '2ki', bookName: '列王纪下', chapters: 25, downloadedChapters: 0, size: '1.2 MB', status: 'not_started' },
  { id: '1ch', bookName: '历代志上', chapters: 29, downloadedChapters: 0, size: '1.3 MB', status: 'not_started' },
  { id: '2ch', bookName: '历代志下', chapters: 36, downloadedChapters: 0, size: '1.5 MB', status: 'not_started' },
  { id: 'ezr', bookName: '以斯拉记', chapters: 10, downloadedChapters: 0, size: '0.5 MB', status: 'not_started' },
  { id: 'neh', bookName: '尼希米记', chapters: 13, downloadedChapters: 0, size: '0.6 MB', status: 'not_started' },
  { id: 'est', bookName: '以斯帖记', chapters: 10, downloadedChapters: 0, size: '0.5 MB', status: 'not_started' },
  { id: 'job', bookName: '约伯记', chapters: 42, downloadedChapters: 0, size: '1.8 MB', status: 'not_started' },
  { id: 'psa', bookName: '诗篇', chapters: 150, downloadedChapters: 0, size: '4.5 MB', status: 'not_started' },
  { id: 'pro', bookName: '箴言', chapters: 31, downloadedChapters: 0, size: '1.3 MB', status: 'not_started' },
  { id: 'ecc', bookName: '传道书', chapters: 12, downloadedChapters: 0, size: '0.5 MB', status: 'not_started' },
  { id: 'sng', bookName: '雅歌', chapters: 8, downloadedChapters: 0, size: '0.4 MB', status: 'not_started' },
  { id: 'isa', bookName: '以赛亚书', chapters: 66, downloadedChapters: 0, size: '2.8 MB', status: 'not_started' },
  { id: 'jer', bookName: '耶利米书', chapters: 52, downloadedChapters: 0, size: '2.4 MB', status: 'not_started' },
  { id: 'lam', bookName: '耶利米哀歌', chapters: 5, downloadedChapters: 0, size: '0.3 MB', status: 'not_started' },
  { id: 'ezk', bookName: '以西结书', chapters: 48, downloadedChapters: 0, size: '2.2 MB', status: 'not_started' },
  { id: 'dan', bookName: '但以理书', chapters: 12, downloadedChapters: 0, size: '0.8 MB', status: 'not_started' },
  { id: 'hos', bookName: '何西阿书', chapters: 14, downloadedChapters: 0, size: '0.5 MB', status: 'not_started' },
  { id: 'jol', bookName: '约珥书', chapters: 3, downloadedChapters: 0, size: '0.2 MB', status: 'not_started' },
  { id: 'amo', bookName: '阿摩司书', chapters: 9, downloadedChapters: 0, size: '0.4 MB', status: 'not_started' },
  { id: 'oba', bookName: '俄巴底亚书', chapters: 1, downloadedChapters: 0, size: '0.1 MB', status: 'not_started' },
  { id: 'jon', bookName: '约拿书', chapters: 4, downloadedChapters: 0, size: '0.2 MB', status: 'not_started' },
  { id: 'mic', bookName: '弥迦书', chapters: 7, downloadedChapters: 0, size: '0.3 MB', status: 'not_started' },
  { id: 'nah', bookName: '那鸿书', chapters: 3, downloadedChapters: 0, size: '0.2 MB', status: 'not_started' },
  { id: 'hab', bookName: '哈巴谷书', chapters: 3, downloadedChapters: 0, size: '0.2 MB', status: 'not_started' },
  { id: 'zep', bookName: '西番雅书', chapters: 3, downloadedChapters: 0, size: '0.2 MB', status: 'not_started' },
  { id: 'hag', bookName: '哈该书', chapters: 2, downloadedChapters: 0, size: '0.1 MB', status: 'not_started' },
  { id: 'zec', bookName: '撒迦利亚书', chapters: 14, downloadedChapters: 0, size: '0.6 MB', status: 'not_started' },
  { id: 'mal', bookName: '玛拉基书', chapters: 4, downloadedChapters: 0, size: '0.2 MB', status: 'not_started' },
  { id: 'mat', bookName: '马太福音', chapters: 28, downloadedChapters: 0, size: '2.0 MB', status: 'not_started' },
  { id: 'mrk', bookName: '马可福音', chapters: 16, downloadedChapters: 0, size: '1.4 MB', status: 'not_started' },
  { id: 'luk', bookName: '路加福音', chapters: 24, downloadedChapters: 0, size: '1.8 MB', status: 'not_started' },
  { id: 'jhn', bookName: '约翰福音', chapters: 21, downloadedChapters: 0, size: '1.7 MB', status: 'not_started' },
  { id: 'act', bookName: '使徒行传', chapters: 28, downloadedChapters: 0, size: '1.9 MB', status: 'not_started' },
  { id: 'rom', bookName: '罗马书', chapters: 16, downloadedChapters: 0, size: '1.2 MB', status: 'not_started' },
  { id: '1co', bookName: '哥林多前书', chapters: 16, downloadedChapters: 0, size: '1.1 MB', status: 'not_started' },
  { id: '2co', bookName: '哥林多后书', chapters: 13, downloadedChapters: 0, size: '0.8 MB', status: 'not_started' },
  { id: 'gal', bookName: '加拉太书', chapters: 6, downloadedChapters: 0, size: '0.5 MB', status: 'not_started' },
  { id: 'eph', bookName: '以弗所书', chapters: 6, downloadedChapters: 0, size: '0.6 MB', status: 'not_started' },
  { id: 'php', bookName: '腓立比书', chapters: 4, downloadedChapters: 0, size: '0.4 MB', status: 'not_started' },
  { id: 'col', bookName: '歌罗西书', chapters: 4, downloadedChapters: 0, size: '0.4 MB', status: 'not_started' },
  { id: '1th', bookName: '帖撒罗尼迦前书', chapters: 5, downloadedChapters: 0, size: '0.4 MB', status: 'not_started' },
  { id: '2th', bookName: '帖撒罗尼迦后书', chapters: 3, downloadedChapters: 0, size: '0.3 MB', status: 'not_started' },
  { id: '1ti', bookName: '提摩太前书', chapters: 6, downloadedChapters: 0, size: '0.5 MB', status: 'not_started' },
  { id: '2ti', bookName: '提摩太后书', chapters: 4, downloadedChapters: 0, size: '0.3 MB', status: 'not_started' },
  { id: 'tit', bookName: '提多书', chapters: 3, downloadedChapters: 0, size: '0.2 MB', status: 'not_started' },
  { id: 'phm', bookName: '腓利门书', chapters: 1, downloadedChapters: 0, size: '0.1 MB', status: 'not_started' },
  { id: 'heb', bookName: '希伯来书', chapters: 13, downloadedChapters: 0, size: '0.9 MB', status: 'not_started' },
  { id: 'jas', bookName: '雅各书', chapters: 5, downloadedChapters: 0, size: '0.4 MB', status: 'not_started' },
  { id: '1pe', bookName: '彼得前书', chapters: 5, downloadedChapters: 0, size: '0.4 MB', status: 'not_started' },
  { id: '2pe', bookName: '彼得后书', chapters: 3, downloadedChapters: 0, size: '0.3 MB', status: 'not_started' },
  { id: '1jn', bookName: '约翰一书', chapters: 5, downloadedChapters: 0, size: '0.4 MB', status: 'not_started' },
  { id: '2jn', bookName: '约翰二书', chapters: 1, downloadedChapters: 0, size: '0.1 MB', status: 'not_started' },
  { id: '3jn', bookName: '约翰三书', chapters: 1, downloadedChapters: 0, size: '0.1 MB', status: 'not_started' },
  { id: 'jud', bookName: '犹大书', chapters: 1, downloadedChapters: 0, size: '0.1 MB', status: 'not_started' },
  { id: 'rev', bookName: '启示录', chapters: 22, downloadedChapters: 0, size: '1.4 MB', status: 'not_started' },
];

export default function OfflineScreen() {
  const router = useRouter();
  const [downloads, setDownloads] = useState<DownloadItem[]>(BOOKS_TO_DOWNLOAD);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  const totalSize = '66.8 MB';
  const downloadedCount = downloads.filter(d => d.status === 'completed').length;
  const totalBooks = downloads.length;

  const toggleBook = (bookId: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const selectAll = () => {
    if (selectedBooks.length === downloads.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(downloads.map(d => d.id));
    }
  };

  const downloadSelected = async () => {
    if (selectedBooks.length === 0) {
      Alert.alert('提示', '请选择要下载的书卷');
      return;
    }

    setDownloading(true);
    
    // Simulate download progress
    for (const bookId of selectedBooks) {
      const book = downloads.find(d => d.id === bookId);
      if (!book) continue;

      setDownloads(prev => prev.map(d => 
        d.id === bookId ? { ...d, status: 'downloading' as const } : d
      ));

      // Simulate chapter-by-chapter download
      for (let i = 1; i <= book.chapters; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setDownloads(prev => prev.map(d => 
          d.id === bookId ? { ...d, downloadedChapters: i } : d
        ));
      }

      setDownloads(prev => prev.map(d => 
        d.id === bookId ? { ...d, status: 'completed' as const } : d
      ));
    }

    setDownloading(false);
    setSelectedBooks([]);
    Alert.alert('下载完成', '所选书卷已下载到本地');
  };

  const deleteDownload = (bookId: string) => {
    Alert.alert(
      '删除下载',
      '确定要删除此书卷的下载吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: () => {
            setDownloads(prev => prev.map(d => 
              d.id === bookId ? { ...d, status: 'not_started', downloadedChapters: 0 } : d
            ));
          }
        },
      ]
    );
  };

  const renderBookItem = ({ item }: { item: DownloadItem }) => {
    const isSelected = selectedBooks.includes(item.id);
    const progress = item.downloadedChapters / item.chapters;

    return (
      <TouchableOpacity 
        style={[styles.bookItem, isSelected && styles.bookItemSelected]}
        onPress={() => item.status === 'not_started' && toggleBook(item.id)}
        onLongPress={() => item.status === 'completed' && deleteDownload(item.id)}
      >
        <View style={styles.bookCheckbox}>
          {item.status === 'completed' ? (
            <Text style={styles.checkmark}>✓</Text>
          ) : item.status === 'downloading' ? (
            <Text style={styles.downloadingIcon}>⟳</Text>
          ) : isSelected ? (
            <Text style={styles.checkmark}>✓</Text>
          ) : (
            <View style={styles.checkbox} />
          )}
        </View>
        
        <View style={styles.bookInfo}>
          <Text style={styles.bookName}>{item.bookName}</Text>
          <Text style={styles.bookMeta}>
            {item.status === 'completed' 
              ? '已下载' 
              : item.status === 'downloading'
                ? `下载中 ${item.downloadedChapters}/${item.chapters} 章`
                : `${item.chapters} 章 · ${item.size}`}
          </Text>
          
          {item.status === 'downloading' && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          )}
        </View>

        {item.status === 'completed' && (
          <Text style={styles.downloadedBadge}>已下载</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>离线阅读</Text>
        <Text style={styles.subtitle}>下载圣经到本地，无网也能读</Text>
      </View>

      {/* Storage Info */}
      <View style={styles.storageCard}>
        <View style={styles.storageInfo}>
          <Text style={styles.storageLabel}>已下载</Text>
          <Text style={styles.storageValue}>{downloadedCount} / {totalBooks} 卷</Text>
        </View>
        <View style={styles.storageInfo}>
          <Text style={styles.storageLabel}>占用空间</Text>
          <Text style={styles.storageValue}>约 {totalSize}</Text>
        </View>
        <View style={styles.storageBar}>
          <View style={styles.storageBarFill} />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={selectAll}>
          <Text style={styles.actionText}>
            {selectedBooks.length === downloads.length ? '取消全选' : '全选'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.downloadButton,
            (selectedBooks.length === 0 || downloading) && styles.downloadButtonDisabled
          ]} 
          onPress={downloadSelected}
          disabled={selectedBooks.length === 0 || downloading}
        >
          <Text style={styles.downloadButtonText}>
            {downloading ? '下载中...' : `下载 (${selectedBooks.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Books List */}
      <ScrollView style={styles.bookList} showsVerticalScrollIndicator={false}>
        {downloads.map(book => renderBookItem({ item: book }))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#ffffff',
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
  storageCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  storageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storageLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  storageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  storageBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    width: '0%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#0f172a',
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  bookList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  bookItemSelected: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#0f172a',
  },
  bookCheckbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  checkmark: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  downloadingIcon: {
    fontSize: 18,
    color: '#64748b',
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  bookMeta: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  downloadedBadge: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
});
