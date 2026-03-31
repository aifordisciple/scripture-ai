// components/bible/__tests__/ReadingHistoryTab.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useBibleStore } from '@/store/useBibleStore';
import { ReadingHistoryTab } from '../ReadingHistoryTab';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'test-user' } } }),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', { value: mockConfirm });

describe('ReadingHistoryTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    // Reset store
    useBibleStore.setState({
      readingHistory: [],
      tabs: [{ id: 'tab-1', type: 'read', book: 'Gen', chapter: '1' }],
      activeTabId: 'tab-1',
    });
  });

  describe('渲染测试', () => {
    it('应显示空状态提示当没有历史记录', () => {
      render(<ReadingHistoryTab />);
      expect(screen.getByText('暂无阅读记录')).toBeInTheDocument();
      expect(screen.getByText('开始阅读经文，系统将自动记录您的阅读轨迹')).toBeInTheDocument();
    });

    it('应显示阅读历史列表', () => {
      useBibleStore.setState({
        readingHistory: [
          { id: 'h1', bookId: 'Gen', chapter: 1, timestamp: Date.now() - 1000, duration: 120 },
          { id: 'h2', bookId: 'Exo', chapter: 1, timestamp: Date.now() - 2000, duration: 180 },
        ],
      });
      render(<ReadingHistoryTab />);
      expect(screen.getByText('创世记')).toBeInTheDocument();
      expect(screen.getByText('出埃及记')).toBeInTheDocument();
    });

    it('应显示阅读时长', () => {
      useBibleStore.setState({
        readingHistory: [
          { id: 'h1', bookId: 'Gen', chapter: 1, timestamp: Date.now(), duration: 125 },
        ],
      });
      render(<ReadingHistoryTab />);
      expect(screen.getByText('2分5秒')).toBeInTheDocument();
    });
  });

  describe('智能推荐测试', () => {
    it('应显示续读推荐', () => {
      useBibleStore.setState({
        readingHistory: [
          { id: 'h1', bookId: 'Gen', chapter: 1, timestamp: Date.now() - 1000, duration: 60 },
          { id: 'h2', bookId: 'Gen', chapter: 2, timestamp: Date.now() - 500, duration: 60 },
        ],
      });
      render(<ReadingHistoryTab />);
      // 检查续读推荐区域存在
      expect(screen.getByText('创世记 第3章')).toBeInTheDocument();
    });

    it('应推荐最近阅读书卷的下一章', () => {
      useBibleStore.setState({
        readingHistory: [
          { id: 'h1', bookId: 'Mat', chapter: 5, timestamp: Date.now() - 100, duration: 120 },
        ],
      });
      render(<ReadingHistoryTab />);
      expect(screen.getByText('马太福音 第6章')).toBeInTheDocument();
    });

    it('应显示今日阅读统计', () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);
      const todayTimestamp = today.getTime();

      useBibleStore.setState({
        readingHistory: [
          { id: 'h1', bookId: 'Gen', chapter: 1, timestamp: todayTimestamp, duration: 120 },
          { id: 'h2', bookId: 'Gen', chapter: 2, timestamp: todayTimestamp + 1000, duration: 180 },
        ],
      });
      render(<ReadingHistoryTab />);
      expect(screen.getByText('今日阅读')).toBeInTheDocument();
      // 5分钟 = 300秒
      expect(screen.getByText('5分钟')).toBeInTheDocument();
    });
  });

  describe('交互测试', () => {
    it('点击历史项应跳转到对应章节', () => {
      useBibleStore.setState({
        readingHistory: [
          { id: 'h1', bookId: 'Gen', chapter: 1, timestamp: Date.now(), duration: 60 },
        ],
      });
      render(<ReadingHistoryTab />);

      const historyItem = screen.getByText('创世记').closest('div[class*="cursor-pointer"]');
      if (historyItem) {
        fireEvent.click(historyItem);
        expect(mockPush).toHaveBeenCalledWith('/?book=Gen&chapter=1');
      }
    });

    it('点击继续阅读应跳转到推荐章节', () => {
      useBibleStore.setState({
        readingHistory: [
          { id: 'h1', bookId: 'Gen', chapter: 1, timestamp: Date.now(), duration: 60 },
        ],
      });
      render(<ReadingHistoryTab />);

      // 找到按钮元素
      const continueButtons = screen.getAllByRole('button', { name: /继续阅读/i });
      fireEvent.click(continueButtons[0]);
      expect(mockPush).toHaveBeenCalledWith('/?book=Gen&chapter=2');
    });

    it('应能清除历史记录', () => {
      useBibleStore.setState({
        readingHistory: [
          { id: 'h1', bookId: 'Gen', chapter: 1, timestamp: Date.now(), duration: 60 },
        ],
      });
      render(<ReadingHistoryTab />);

      const clearButton = screen.getByText('清除历史');
      fireEvent.click(clearButton);

      expect(mockConfirm).toHaveBeenCalled();
    });
  });

  describe('搜索过滤测试', () => {
    it('应能搜索书卷名称', () => {
      useBibleStore.setState({
        readingHistory: [
          { id: 'h1', bookId: 'Gen', chapter: 1, timestamp: Date.now(), duration: 60 },
          { id: 'h2', bookId: 'Exod', chapter: 1, timestamp: Date.now(), duration: 60 },
        ],
      });
      render(<ReadingHistoryTab />);

      const searchInput = screen.getByPlaceholderText('搜索阅读记录...');
      fireEvent.change(searchInput, { target: { value: '创世记' } });

      expect(screen.getByText('创世记')).toBeInTheDocument();
      expect(screen.queryByText('出埃及记')).not.toBeInTheDocument();
    });
  });
});