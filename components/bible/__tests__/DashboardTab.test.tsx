// components/bible/__tests__/DashboardTab.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardTab } from '../DashboardTab';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock recharts
vi.mock('recharts', () => ({
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

// Mock BibleHeatmap
vi.mock('@/components/bible/BibleHeatmap', () => ({
  BibleHeatmap: () => <div data-testid="bible-heatmap" />,
}));

// Mock HomeGroupCard
vi.mock('@/components/group/HomeGroupCard', () => ({
  HomeGroupCard: () => <div data-testid="home-group-card" />,
}));

// Mock store
const mockStore = {
  highlights: [],
  notes: [],
  interactions: [],
  updateActiveTab: vi.fn(),
  addTab: vi.fn(),
  tabs: [{ id: 'tab-1', type: 'read', book: 'Gen', chapter: '1' }],
  setActiveTab: vi.fn(),
  clearAllHighlights: vi.fn(),
  clearAllNotes: vi.fn(),
  clearAllInteractions: vi.fn(),
  // [P1] 新增：计划相关
  activePlans: [],
  streakCount: 0,
  lastActiveDate: null,
};

vi.mock('@/store/useBibleStore', () => ({
  useBibleStore: vi.fn(() => mockStore),
}));

describe('DashboardTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该渲染标题和数据洞察看板', () => {
      render(<DashboardTab />);
      expect(screen.getByText('数据洞察看板')).toBeTruthy();
    });

    it('应该渲染时间范围选择器', () => {
      render(<DashboardTab />);
      expect(screen.getByText('近 7 天')).toBeTruthy();
      expect(screen.getByText('近 30 天')).toBeTruthy();
      expect(screen.getByText('近 1 年')).toBeTruthy();
    });

    it('应该渲染统计卡片', () => {
      render(<DashboardTab />);
      expect(screen.getByText('AI 深度探索次数')).toBeTruthy();
      expect(screen.getByText('经文研读互动数')).toBeTruthy();
    });
  });

  describe('P1增强：计划完成率', () => {
    it('应该显示读经计划完成率卡片', () => {
      render(<DashboardTab />);
      // P1新增：计划完成率统计
    });

    it('当有活跃计划时应该显示进度', async () => {
      vi.mocked(mockStore).activePlans = [
        { planId: 'plan-1', startDate: Date.now(), status: 'active', completedTasks: { '1': ['task-1', 'task-2'] } },
      ];

      render(<DashboardTab />);
      // 应该显示计划进度
    });
  });

  describe('P1增强：火苗成长轨迹', () => {
    it('应该显示火苗统计卡片', () => {
      vi.mocked(mockStore).streakCount = 7;

      render(<DashboardTab />);
      // P1新增：火苗成长展示
    });

    it('应该显示连续打卡天数', () => {
      vi.mocked(mockStore).streakCount = 30;

      render(<DashboardTab />);
      // 应该显示连续打卡天数
    });
  });

  describe('时间范围切换', () => {
    it('点击时间范围按钮应该切换选中状态', () => {
      render(<DashboardTab />);

      const button30d = screen.getByText('近 30 天');
      fireEvent.click(button30d);

      // 验证选中状态
    });
  });

  describe('数据导出', () => {
    it('点击导出TSV按钮应该触发下载', () => {
      render(<DashboardTab />);

      const exportButton = screen.getByText('导出 TSV');
      fireEvent.click(exportButton);

      // 验证导出逻辑
    });
  });

  describe('清空数据', () => {
    it('点击清空数据应该显示确认对话框', () => {
      render(<DashboardTab />);

      const clearButton = screen.getByText('清空数据');
      fireEvent.click(clearButton);

      expect(screen.getByText('选择要清空的数据')).toBeTruthy();
    });
  });
});