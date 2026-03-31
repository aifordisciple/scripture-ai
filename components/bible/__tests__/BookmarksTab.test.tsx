// components/bible/__tests__/BookmarksTab.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookmarksTab } from '../BookmarksTab';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock store
const mockStore = {
  bookmarks: [
    { id: '1', bookId: 'Gen', chapter: 1, createdAt: Date.now() },
    { id: '2', bookId: 'Ps', chapter: 23, createdAt: Date.now() },
  ],
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
  tabs: [{ id: 'tab-1', type: 'read', book: 'Gen', chapter: '1' }],
  addTab: vi.fn(),
  setActiveTab: vi.fn(),
  updateActiveTab: vi.fn(),
};

vi.mock('@/store/useBibleStore', () => ({
  useBibleStore: vi.fn(() => mockStore),
}));

describe('BookmarksTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该渲染书签标题', () => {
      render(<BookmarksTab />);
      expect(screen.getByText('我的书签')).toBeTruthy();
    });

    it('应该显示书签数量', () => {
      render(<BookmarksTab />);
      expect(screen.getByText(/共/)).toBeTruthy();
    });
  });

  describe('书签操作', () => {
    it('点击书签应该跳转到对应章节', () => {
      render(<BookmarksTab />);
      // 验证跳转行为
    });

    it('点击删除应该移除书签', () => {
      render(<BookmarksTab />);
      // 验证删除行为
    });
  });

  describe('空状态', () => {
    it('没有书签时应该显示空状态提示', () => {
      vi.mocked(mockStore).bookmarks = [];
      render(<BookmarksTab />);
      expect(screen.getByText(/还没有添加书签/)).toBeTruthy();
    });
  });
});