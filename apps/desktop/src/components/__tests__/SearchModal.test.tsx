// apps/desktop/src/components/__tests__/SearchModal.test.tsx
/**
 * Tests for SearchModal component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchModal } from '../SearchModal';

// Mock bibleApi
vi.mock('@scripture-ai/core', () => ({
  bibleApi: {
    search: vi.fn().mockResolvedValue([
      {
        book_id: 'gen',
        chapter: 1,
        verse: 1,
        text: '起初，神创造天地。',
      },
      {
        book_id: 'john',
        chapter: 1,
        verse: 1,
        text: '太初有道，道与神同在。',
      },
    ]),
  },
}));

describe('SearchModal', () => {
  const defaultProps = {
    visible: true,
    onClose: vi.fn(),
    onNavigate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when visible', () => {
    render(<SearchModal {...defaultProps} />);

    expect(screen.getByPlaceholderText(/搜索经文/i)).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(
      <SearchModal
        {...defaultProps}
        visible={false}
      />
    );

    expect(screen.queryByPlaceholderText(/搜索经文/i)).not.toBeInTheDocument();
  });

  it('shows search results after typing', async () => {
    render(<SearchModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(/搜索经文/i);
    fireEvent.change(input, { target: { value: '神' } });

    await waitFor(() => {
      expect(screen.getByText(/起初/)).toBeInTheDocument();
    });
  });

  it('calls onNavigate when result is clicked', async () => {
    render(<SearchModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(/搜索经文/i);
    fireEvent.change(input, { target: { value: '神' } });

    await waitFor(() => {
      const result = screen.getByText(/起初/);
      fireEvent.click(result);
    });

    expect(defaultProps.onNavigate).toHaveBeenCalledWith('gen', 1);
  });

  it('calls onClose when close button is clicked', () => {
    render(<SearchModal {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows empty state when no results', async () => {
    // Override mock to return empty array
    const { bibleApi } = await import('@scripture-ai/core');
    vi.mocked(bibleApi.search).mockResolvedValueOnce([]);

    render(<SearchModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(/搜索经文/i);
    fireEvent.change(input, { target: { value: 'xyz123' } });

    await waitFor(() => {
      expect(screen.getByText(/未找到结果/i)).toBeInTheDocument();
    });
  });
});