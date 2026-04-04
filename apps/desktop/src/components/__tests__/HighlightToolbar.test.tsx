// apps/desktop/src/components/__tests__/HighlightToolbar.test.tsx
/**
 * Tests for HighlightToolbar component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HighlightToolbar } from '../HighlightToolbar';
import { mockInvoke } from '../../../vitest.setup';

describe('HighlightToolbar', () => {
  const defaultProps = {
    visible: true,
    position: { x: 100, y: 100 },
    bookId: 'gen',
    chapter: 1,
    selectedVerses: [1, 2, 3],
    userId: 'test-user',
    existingHighlights: [],
    onHighlightAdded: vi.fn(),
    onHighlightRemoved: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue(undefined);
  });

  it('renders when visible with selected verses', () => {
    render(<HighlightToolbar {...defaultProps} />);

    expect(screen.getByText(/高亮 3 节/)).toBeInTheDocument();
  });

  it('does not render when no verses selected', () => {
    render(
      <HighlightToolbar
        {...defaultProps}
        selectedVerses={[]}
      />
    );

    expect(screen.queryByText(/高亮/)).not.toBeInTheDocument();
  });

  it('renders color options', () => {
    render(<HighlightToolbar {...defaultProps} />);

    // Should have 6 color buttons
    const colorButtons = screen.getAllByRole('button', { name: '' }).filter(
      btn => btn.className.includes('color-btn')
    );
    expect(colorButtons.length).toBe(6);
  });

  it('calls onHighlightAdded when color is clicked', async () => {
    render(<HighlightToolbar {...defaultProps} />);

    const colorButtons = screen.getAllByRole('button').filter(
      btn => btn.className.includes('color-btn')
    );
    fireEvent.click(colorButtons[0]);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        'db_save_highlight',
        expect.objectContaining({
          highlight: expect.objectContaining({
            book_id: 'gen',
            chapter: 1,
            verse_start: 1,
            verse_end: 3,
          }),
        })
      );
    });
  });

  it('shows remove button when highlight exists', () => {
    const existingHighlight = {
      id: 'existing-1',
      user_id: 'test-user',
      book_id: 'gen',
      chapter: 1,
      verse_start: 1,
      verse_end: 3,
      color: '#fef08a',
      created_at: new Date().toISOString(),
    };

    render(
      <HighlightToolbar
        {...defaultProps}
        existingHighlights={[existingHighlight]}
      />
    );

    expect(screen.getByText('删除高亮')).toBeInTheDocument();
  });

  it('calls onAskAI when Ask AI button is clicked', async () => {
    const onAskAI = vi.fn();

    render(
      <HighlightToolbar
        {...defaultProps}
        onAskAI={onAskAI}
      />
    );

    const askAIBtn = screen.getByText('询问AI');
    fireEvent.click(askAIBtn);

    expect(onAskAI).toHaveBeenCalledWith('gen', 1, [1, 2, 3]);
  });

  it('calls onClose when close button is clicked', () => {
    render(<HighlightToolbar {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});