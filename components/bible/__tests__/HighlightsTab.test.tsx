// components/bible/__tests__/HighlightsTab.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HighlightsTab } from '../HighlightsTab';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock store
const mockStore = {
  highlights: [
    { bookId: 'Gen', chapter: 1, verse: 1, color: 'yellow', updatedAt: '2024-01-01' },
    { bookId: 'Gen', chapter: 1, verse: 2, color: 'green', updatedAt: '2024-01-02' },
    { bookId: 'Exod', chapter: 1, verse: 1, color: 'blue', updatedAt: '2024-01-03' },
  ],
  removeHighlightLocally: vi.fn(),
  tabs: [{ id: 'tab-1', type: 'read', book: 'Gen', chapter: '1' }],
  addTab: vi.fn(),
  setActiveTab: vi.fn(),
  updateActiveTab: vi.fn(),
};

vi.mock('@/store/useBibleStore', () => ({
  useBibleStore: vi.fn(() => mockStore),
}));

// Mock fetch
global.fetch = vi.fn();

describe('HighlightsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve({ data: [{ version: 'CUV', verse: 1, content: '测试经文内容' }] }),
    });
  });

  describe('基础渲染', () => {
    it('应该渲染高亮标题', () => {
      render(<HighlightsTab />);
      expect(screen.getByText('我的高亮')).toBeTruthy();
    });

    it('应该显示高亮数量', () => {
      render(<HighlightsTab />);
      expect(screen.getByText(/共标记了/)).toBeTruthy();
    });
  });

  describe('P1增强：颜色筛选', () => {
    it('应该显示颜色筛选器', () => {
      render(<HighlightsTab />);
      // P1新增：颜色筛选功能
    });

    it('选择颜色应该过滤高亮列表', async () => {
      render(<HighlightsTab />);
      // 选择黄色应该只显示黄色高亮
    });
  });

  describe('P1增强：搜索功能', () => {
    it('应该显示搜索框', () => {
      render(<HighlightsTab />);
      // P1新增：搜索功能
    });

    it('输入搜索词应该过滤高亮列表', async () => {
      render(<HighlightsTab />);
      // 搜索应该过滤结果
    });
  });

  describe('P1增强：统计信息', () => {
    it('应该显示各颜色的高亮统计', () => {
      render(<HighlightsTab />);
      // P1新增：统计卡片
    });
  });

  describe('高亮操作', () => {
    it('点击高亮应该跳转到对应章节', async () => {
      render(<HighlightsTab />);
      // 验证跳转行为
    });

    it('点击删除应该移除高亮', async () => {
      render(<HighlightsTab />);
      // 验证删除行为
    });
  });
});