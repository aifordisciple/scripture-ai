// components/bible/__tests__/OfflineIndicator.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfflineIndicator } from '../OfflineIndicator';

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染测试', () => {
    it('应显示在线状态', () => {
      render(<OfflineIndicator isOnline={true} />);
      expect(screen.getByText('在线')).toBeInTheDocument();
    });

    it('应显示离线状态', () => {
      render(<OfflineIndicator isOnline={false} />);
      expect(screen.getByText('离线')).toBeInTheDocument();
    });

    it('离线时应显示警告样式', () => {
      render(<OfflineIndicator isOnline={false} />);
      const indicator = screen.getByText('离线').closest('div');
      expect(indicator).toHaveClass('bg-amber-100');
    });
  });

  describe('缓存状态测试', () => {
    it('应显示缓存章节数', () => {
      render(<OfflineIndicator isOnline={true} cachedChapters={50} />);
      expect(screen.getByText('50章已缓存')).toBeInTheDocument();
    });

    it('无缓存时不显示缓存数', () => {
      render(<OfflineIndicator isOnline={true} cachedChapters={0} />);
      expect(screen.queryByText('章已缓存')).not.toBeInTheDocument();
    });
  });

  describe('交互测试', () => {
    it('点击应展开详情', () => {
      render(<OfflineIndicator isOnline={false} cachedChapters={10} />);
      const indicator = screen.getByText('离线').closest('div');
      if (indicator) {
        fireEvent.click(indicator);
        expect(screen.getByText('离线模式')).toBeInTheDocument();
      }
    });

    it('应能手动同步', () => {
      const onSync = vi.fn();
      render(<OfflineIndicator isOnline={true} onSync={onSync} />);
      const indicator = screen.getByText('在线').closest('div');
      if (indicator) {
        fireEvent.click(indicator);
        const syncButton = screen.getByText('立即同步');
        fireEvent.click(syncButton);
        expect(onSync).toHaveBeenCalled();
      }
    });
  });
});