import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageList } from '../MessageList'

// Mock dependencies
vi.mock('@/store/useBibleStore', () => ({
  useBibleStore: () => ({
    aiFontSize: 'medium',
    savedInsights: [],
    aiRequestTrigger: null,
  }),
}))

vi.mock('@/components/ui/AudioButton', () => ({
  AudioButton: () => <button data-testid="audio-button">朗读</button>,
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}))

describe('MessageList', () => {
  const mockMessages = [
    { id: '1', role: 'user' as const, content: '用户消息' },
    { id: '2', role: 'assistant' as const, content: 'AI 回复内容' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no messages', () => {
    render(
      <MessageList
        messages={[]}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        onSaveInsight={vi.fn()}
        onShare={vi.fn()}
      />
    )

    expect(screen.getByText('选中经文，点击菜单即可开始')).toBeInTheDocument()
  })

  it('renders all messages', () => {
    render(
      <MessageList
        messages={mockMessages}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        onSaveInsight={vi.fn()}
        onShare={vi.fn()}
      />
    )

    expect(screen.getByText('用户消息')).toBeInTheDocument()
    expect(screen.getByText('AI 回复内容')).toBeInTheDocument()
  })

  it('shows loading indicator when loading', () => {
    render(
      <MessageList
        messages={mockMessages}
        isLoading={true}
        error={null}
        onRetry={vi.fn()}
        onSaveInsight={vi.fn()}
        onShare={vi.fn()}
      />
    )

    // 验证最新消息有加载指示器
    const indicators = document.querySelectorAll('.animate-pulse')
    expect(indicators.length).toBeGreaterThan(0)
  })

  it('shows error message when error occurs', () => {
    render(
      <MessageList
        messages={mockMessages}
        isLoading={false}
        error={new Error('AI 生成失败')}
        onRetry={vi.fn()}
        onSaveInsight={vi.fn()}
        onShare={vi.fn()}
      />
    )

    expect(screen.getByText(/AI 生成已中断/)).toBeInTheDocument()
  })

  it('renders with different font sizes', () => {
    const { rerender } = render(
      <MessageList
        messages={mockMessages}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        onSaveInsight={vi.fn()}
        onShare={vi.fn()}
        fontSize="small"
      />
    )

    expect(screen.getByText('AI 回复内容')).toBeInTheDocument()

    rerender(
      <MessageList
        messages={mockMessages}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        onSaveInsight={vi.fn()}
        onShare={vi.fn()}
        fontSize="large"
      />
    )

    expect(screen.getByText('AI 回复内容')).toBeInTheDocument()
  })
})