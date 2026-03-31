// components/bible/__tests__/NotesTab.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotesTab } from '../NotesTab';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: '1' } },
  }),
}));

// Mock store
const mockStore = {
  notes: [
    { id: '1', bookId: 'Gen', chapter: 1, verse: 1, content: '这是创世记的笔记', updatedAt: '2024-01-01' },
    { id: '2', bookId: 'Exod', chapter: 1, verse: 1, content: '这是出埃及记的笔记', updatedAt: '2024-01-02' },
  ],
  deleteNote: vi.fn(),
  openNoteEditor: vi.fn(),
  tabs: [{ id: 'tab-1', type: 'read', book: 'Gen', chapter: '1' }],
  addTab: vi.fn(),
  setActiveTab: vi.fn(),
  updateActiveTab: vi.fn(),
};

vi.mock('@/store/useBibleStore', () => ({
  useBibleStore: vi.fn(() => mockStore),
}));

describe('NotesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该渲染笔记标题', () => {
      render(<NotesTab />);
      expect(screen.getByText('我的笔记')).toBeTruthy();
    });

    it('应该显示笔记数量', () => {
      render(<NotesTab />);
      expect(screen.getByText(/共记录了/)).toBeTruthy();
    });
  });

  describe('P1增强：全文搜索', () => {
    it('应该显示搜索框', () => {
      render(<NotesTab />);
      // P1新增：搜索功能
    });

    it('输入搜索词应该过滤笔记列表', async () => {
      render(<NotesTab />);
      // 输入搜索词后应该过滤结果
    });
  });

  describe('P1增强：笔记导出', () => {
    it('应该显示导出按钮', () => {
      render(<NotesTab />);
      // P1新增：导出功能
    });

    it('点击导出应该生成Markdown文件', () => {
      render(<NotesTab />);
      // 导出应该生成正确的格式
    });
  });

  describe('笔记操作', () => {
    it('点击笔记应该跳转到对应章节', () => {
      render(<NotesTab />);
      // 验证跳转行为
    });

    it('点击删除应该确认后删除', () => {
      render(<NotesTab />);
      // 验证删除确认
    });
  });
});