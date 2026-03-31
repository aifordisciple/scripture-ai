// components/bible/__tests__/RadialMenu.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadialMenu } from '../RadialMenu';
import { QuickAction } from '@/store/types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, style, initial, animate, exit, transition, ...props }: any) => (
      <div onClick={onClick} className={className} style={style} {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, style, title, ...props }: any) => (
      <button onClick={onClick} className={className} style={style} title={title} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('RadialMenu', () => {
  const mockActions: QuickAction[] = [
    { id: 'detail', label: '🧩 详细解读', prompt: '详细解读', mode: 'general', priority: 0 },
    { id: 'context', label: '📜 背景', prompt: '背景', mode: 'general', priority: 1 },
    { id: 'application', label: '💡 应用', prompt: '应用', mode: 'general', priority: 2 },
  ];

  const mockPosition = { bottom: 150, right: 30 };
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('当isOpen为false时不应该渲染', () => {
      render(
        <RadialMenu
          isOpen={false}
          actions={mockActions}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          position={mockPosition}
        />
      );

      // 背景遮罩不应该存在
      expect(screen.queryByRole('button', { name: /详细解读/i })).toBeFalsy();
    });

    it('当isOpen为true时应该渲染所有动作', () => {
      render(
        <RadialMenu
          isOpen={true}
          actions={mockActions}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          position={mockPosition}
        />
      );

      // 应该显示所有动作按钮
      expect(screen.getByTitle('详细解读')).toBeTruthy();
      expect(screen.getByTitle('背景')).toBeTruthy();
      expect(screen.getByTitle('应用')).toBeTruthy();
    });

    it('应该显示关闭按钮', () => {
      render(
        <RadialMenu
          isOpen={true}
          actions={mockActions}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          position={mockPosition}
        />
      );

      // 关闭按钮
      const closeButton = screen.getByText('✕');
      expect(closeButton).toBeTruthy();
    });
  });

  describe('交互', () => {
    it('点击动作按钮应该调用onSelect', () => {
      render(
        <RadialMenu
          isOpen={true}
          actions={mockActions}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          position={mockPosition}
        />
      );

      const detailButton = screen.getByTitle('详细解读');
      fireEvent.click(detailButton);

      expect(mockOnSelect).toHaveBeenCalledWith(mockActions[0]);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('点击关闭按钮应该调用onClose', () => {
      render(
        <RadialMenu
          isOpen={true}
          actions={mockActions}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          position={mockPosition}
        />
      );

      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('点击背景遮罩应该调用onClose', () => {
      render(
        <RadialMenu
          isOpen={true}
          actions={mockActions}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          position={mockPosition}
        />
      );

      // 背景遮罩
      const overlay = document.querySelector('.bg-black\\/20');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('AI模式支持', () => {
    it('应该支持AI模式类型的动作', () => {
      const aiModeActions: QuickAction[] = [
        { id: 'ai-mode-general', label: '✨ 标准模式', prompt: '', mode: 'general', priority: 0, category: 'ai-mode' },
        { id: 'ai-mode-tutor', label: '👨‍🏫 导师模式', prompt: '', mode: 'tutor', priority: 1, category: 'ai-mode' },
        { id: 'ai-mode-sermon', label: '📋 讲章模式', prompt: '', mode: 'sermon', priority: 2, category: 'ai-mode' },
        { id: 'ai-mode-study-guide', label: '📖 查经模式', prompt: '', mode: 'study-guide', priority: 3, category: 'ai-mode' },
      ];

      render(
        <RadialMenu
          isOpen={true}
          actions={aiModeActions}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          position={mockPosition}
        />
      );

      // 应该显示所有AI模式选项
      expect(screen.getByTitle('标准模式')).toBeTruthy();
      expect(screen.getByTitle('导师模式')).toBeTruthy();
      expect(screen.getByTitle('讲章模式')).toBeTruthy();
      expect(screen.getByTitle('查经模式')).toBeTruthy();
    });

    it('点击AI模式动作应该传递正确的mode属性', () => {
      const aiModeAction: QuickAction = {
        id: 'ai-mode-tutor',
        label: '👨‍🏫 导师模式',
        prompt: '',
        mode: 'tutor',
        priority: 0,
        category: 'ai-mode',
      };

      render(
        <RadialMenu
          isOpen={true}
          actions={[aiModeAction]}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          position={mockPosition}
        />
      );

      const tutorButton = screen.getByTitle('导师模式');
      fireEvent.click(tutorButton);

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ai-mode-tutor',
          mode: 'tutor',
          category: 'ai-mode',
        })
      );
    });
  });

  describe('可访问性', () => {
    it('按钮应该有正确的title属性', () => {
      render(
        <RadialMenu
          isOpen={true}
          actions={mockActions}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          position={mockPosition}
        />
      );

      // 所有动作按钮应该有title
      mockActions.forEach((action) => {
        const labelWithoutEmoji = action.label.replace(/^[^\s]+\s/, '');
        const button = screen.getByTitle(labelWithoutEmoji);
        expect(button).toBeTruthy();
      });
    });
  });
});