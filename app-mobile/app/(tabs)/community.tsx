// app-mobile/app/(tabs)/community.tsx
// Community tab - Friends and Feed

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, FlatList, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  verseRef?: string;
  likes: number;
  comments: number;
  timestamp: string;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
}

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    userId: 'u1',
    userName: '小明',
    userAvatar: '',
    content: '今天读约翰福音3:16，非常感动。神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。',
    verseRef: '约3:16',
    likes: 12,
    comments: 3,
    timestamp: '2小时前',
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Sarah',
    userAvatar: '',
    content: '完成了一年的读经计划！荣耀归给神！',
    likes: 28,
    comments: 5,
    timestamp: '5小时前',
  },
];

const MOCK_FRIENDS: Friend[] = [
  { id: '1', name: '小明', avatar: '', status: 'online' },
  { id: '2', name: '大卫', avatar: '', status: 'offline' },
  { id: '3', name: '以琳', avatar: '', status: 'online' },
];

export default function CommunityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends'>('feed');
  const [newPost, setNewPost] = useState('');

  const handlePost = () => {
    if (!newPost.trim()) return;
    // API call to create post
    setNewPost('');
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>{item.userName[0]}</Text>
        </View>
        <View style={styles.postUserInfo}>
          <Text style={styles.postUserName}>{item.userName}</Text>
          <Text style={styles.postTimestamp}>{item.timestamp}</Text>
        </View>
      </View>
      
      <Text style={styles.postContent}>{item.content}</Text>
      
      {item.verseRef && (
        <TouchableOpacity style={styles.verseTag}>
          <Text style={styles.verseTagText}>{item.verseRef}</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>❤️</Text>
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity style={styles.friendItem}>
      <View style={styles.friendAvatar}>
        <Text style={styles.friendAvatarText}>{item.name[0]}</Text>
        <View style={[
          styles.statusDot,
          item.status === 'online' ? styles.statusOnline : styles.statusOffline
        ]} />
      </View>
      <Text style={styles.friendName}>{item.name}</Text>
      <Text style={styles.friendStatus}>
        {item.status === 'online' ? '在线' : '离线'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>社区</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.tabActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>
            动态
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            好友
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'feed' ? (
        <>
          {/* New Post Input */}
          <View style={styles.newPostContainer}>
            <TextInput
              style={styles.newPostInput}
              placeholder="分享你的读经感动..."
              placeholderTextColor="#94a3b8"
              value={newPost}
              onChangeText={setNewPost}
              multiline
            />
            <TouchableOpacity style={styles.postButton} onPress={handlePost}>
              <Text style={styles.postButtonText}>发布</Text>
            </TouchableOpacity>
          </View>

          {/* Feed List */}
          <FlatList
            data={MOCK_POSTS}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.feedList}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <>
          {/* Friends List */}
          <View style={styles.friendsHeader}>
            <Text style={styles.friendsTitle}>我的好友 ({MOCK_FRIENDS.length})</Text>
            <TouchableOpacity>
              <Text style={styles.addFriendButton}>+ 添加好友</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={MOCK_FRIENDS}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.friendsList}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#0f172a',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  newPostContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  newPostInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    maxHeight: 80,
  },
  postButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  postButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  feedList: {
    padding: 16,
    paddingTop: 0,
  },
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  postUserInfo: {
    marginLeft: 12,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  postTimestamp: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  verseTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
  },
  verseTagText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#64748b',
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  friendsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  addFriendButton: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  friendsList: {
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  statusOnline: {
    backgroundColor: '#22c55e',
  },
  statusOffline: {
    backgroundColor: '#94a3b8',
  },
  friendName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginLeft: 12,
  },
  friendStatus: {
    fontSize: 13,
    color: '#64748b',
  },
});
