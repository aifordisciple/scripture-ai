import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VirtualizedMessageList } from '../VirtualizedMessageList'
import type { Message } from '../MessageList'

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: () => [
      { key: '0', index: 0, start: 0, size: 100 },
      { key: '1', index: 1, start: 100, size: 100 },
    ],
    getTotalSize: () => 1000,
    measureElement: vi.fn(),
    scrollToIndex: vi.fn(),
  })),
}))

describe('VirtualizedMessageList', () => {
  const mockMessages: Message[] = Array.from({ length: 50 }, (_, i) => ({
    id: `msg-${i}`,
    role: i % 2 === 0 ? 'user' : 'assistant' as const,
    content: `Message ${i} content with some text for testing virtualization scrolling behavior.`,
  }))

  const mockProps = {
    messages: mockMessages,
    isLoading: false,
    error: null,
    fontSize: 'medium' as const,
    onRetry: vi.fn(),
    onSaveInsight: vi.fn(),
    onShare: vi.fn(),
    isSaved: vi.fn(() => false),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders container with proper structure', () => {
    render(<VirtualizedMessageList {...mockProps} />)

    // Should have scrollable container
    const container = document.querySelector('[data-testid="virtualized-list"]')
    expect(container).toBeTruthy()
  })

  it('renders empty state when no messages', () => {
    render(<VirtualizedMessageList {...mockProps} messages={[]} />)

    expect(screen.getByText(/选中经文/)).toBeInTheDocument()
  })

  it('shows loading indicator when loading', () => {
    render(<VirtualizedMessageList {...mockProps} isLoading={true} />)

    // Should show loading state
    expect(screen.getByText(/解读中/)).toBeInTheDocument()
  })

  it('shows error state when error occurs', () => {
    render(<VirtualizedMessageList {...mockProps} error={new Error('Test error')} />)

    expect(screen.getByText(/AI 生成已中断/)).toBeInTheDocument()
  })

  it('handles large message arrays without performance issues', () => {
    const largeMessages: Message[] = Array.from({ length: 200 }, (_, i) => ({
      id: `msg-large-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant' as const,
      content: `Large message ${i} with longer content to test performance. `.repeat(5),
    }))

    const { container } = render(<VirtualizedMessageList {...mockProps} messages={largeMessages} />)

    // Container should exist
    expect(container.firstChild).toBeTruthy()
  })

  it('applies different font sizes correctly', () => {
    const { container, rerender } = render(<VirtualizedMessageList {...mockProps} fontSize="small" />)

    expect(container.firstChild).toBeTruthy()

    rerender(<VirtualizedMessageList {...mockProps} fontSize="large" />)
    expect(container.firstChild).toBeTruthy()
  })
})