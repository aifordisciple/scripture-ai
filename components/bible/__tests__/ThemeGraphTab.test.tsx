// components/bible/__tests__/ThemeGraphTab.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useBibleStore } from '@/store/useBibleStore';
import { ThemeGraphTab } from '../ThemeGraphTab';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ThemeGraphTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBibleStore.setState({
      tabs: [{ id: 'tab-1', type: 'read', book: 'Gen', chapter: '1' }],
      activeTabId: 'tab-1',
    });
  });

  describe('渲染测试', () => {
    it('应显示主题图谱标题', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ themes: [], connections: [] }),
      });
      render(<ThemeGraphTab />);
      expect(screen.getByText('主题图谱')).toBeInTheDocument();
    });

    it('应显示加载状态', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      render(<ThemeGraphTab />);
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('应显示主题列表', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          themes: [
            { id: 't1', nameZh: '救赎', category: 'THEOLOGICAL', verseCount: 50 },
            { id: 't2', nameZh: '恩典', category: 'THEOLOGICAL', verseCount: 40 },
          ],
          connections: [],
        }),
      });
      render(<ThemeGraphTab />);

      // 等待加载完成
      await screen.findByText('救赎');
      expect(screen.getByText('恩典')).toBeInTheDocument();
    });
  });

  describe('搜索过滤测试', () => {
    it('应能搜索主题', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          themes: [
            { id: 't1', nameZh: '救赎', category: 'THEOLOGICAL', verseCount: 50 },
            { id: 't2', nameZh: '恩典', category: 'THEOLOGICAL', verseCount: 40 },
          ],
          connections: [],
        }),
      });
      render(<ThemeGraphTab />);

      await screen.findByText('救赎');
      const searchInput = screen.getByPlaceholderText('搜索主题...');
      fireEvent.change(searchInput, { target: { value: '救赎' } });

      expect(screen.getByText('救赎')).toBeInTheDocument();
      expect(screen.queryByText('恩典')).not.toBeInTheDocument();
    });
  });

  describe('分类筛选测试', () => {
    it('应能按分类筛选主题', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          themes: [
            { id: 't1', nameZh: '救赎', category: 'THEOLOGICAL', verseCount: 50 },
            { id: 't2', nameZh: '诚实', category: 'ETHICAL', verseCount: 30 },
          ],
          connections: [],
        }),
      });
      render(<ThemeGraphTab />);

      await screen.findByText('救赎');
      const theologicalButton = screen.getByRole('button', { name: /神学/i });
      fireEvent.click(theologicalButton);

      expect(screen.getByText('救赎')).toBeInTheDocument();
      expect(screen.queryByText('诚实')).not.toBeInTheDocument();
    });
  });

  describe('主题详情测试', () => {
    it('点击主题应显示详情', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          themes: [
            { id: 't1', nameZh: '救赎', category: 'THEOLOGICAL', verseCount: 50, summary: '上帝拯救人类的计划' },
          ],
          connections: [],
        }),
      });
      render(<ThemeGraphTab />);

      await screen.findByText('救赎');
      const themeCard = screen.getByText('救赎').closest('div[class*="cursor-pointer"]');
      if (themeCard) {
        fireEvent.click(themeCard);
        expect(screen.getByText('上帝拯救人类的计划')).toBeInTheDocument();
      }
    });
  });
});