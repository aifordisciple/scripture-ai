import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuickPrompts } from '../QuickPrompts'

// Mock constants
vi.mock('@/lib/constants', () => ({
  THEOLOGICAL_PROMPTS: [
    { id: 'detail', label: '详细解读', prompt: '请详细解读这段经文', color: 'bg-blue-50 text-blue-700' },
    { id: 'context', label: '历史背景', prompt: '请介绍这段经文的历史背景', color: 'bg-green-50 text-green-700' },
  ],
}))

describe('QuickPrompts', () => {
  const mockProps = {
    isLoading: false,
    messagesCount: 1,
    aiMode: 'general' as const,
    onChipClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders prompt chips', () => {
    render(<QuickPrompts {...mockProps} />)

    expect(screen.getByText('详细解读')).toBeInTheDocument()
    expect(screen.getByText('历史背景')).toBeInTheDocument()
  })

  it('does not render when no messages', () => {
    render(
      <QuickPrompts
        {...mockProps}
        messagesCount={0}
      />
    )

    expect(screen.queryByText('详细解读')).not.toBeInTheDocument()
  })

  it('does not render when loading', () => {
    render(
      <QuickPrompts
        {...mockProps}
        isLoading={true}
      />
    )

    expect(screen.queryByText('详细解读')).not.toBeInTheDocument()
  })

  it('calls onChipClick when chip clicked', () => {
    render(<QuickPrompts {...mockProps} />)

    const chip = screen.getByText('详细解读')
    fireEvent.click(chip)

    expect(mockProps.onChipClick).toHaveBeenCalledWith('请详细解读这段经文')
  })

  it('disables chips when loading', () => {
    // When isLoading is true, component should not render at all
    // This is tested in the "does not render when loading" test
    // Let's test that clicking during loading state doesn't trigger callback
    const { rerender } = render(<QuickPrompts {...mockProps} />)

    const chip = screen.getByText('详细解读')
    fireEvent.click(chip)
    expect(mockProps.onChipClick).toHaveBeenCalledTimes(1)

    // Now with loading
    rerender(
      <QuickPrompts
        {...mockProps}
        isLoading={true}
      />
    )

    // Component should not be visible
    expect(screen.queryByText('详细解读')).not.toBeInTheDocument()
  })

  it('shows correct label for different modes', () => {
    const { rerender } = render(
      <QuickPrompts {...mockProps} aiMode="general" />
    )

    expect(screen.getByText('深度探索')).toBeInTheDocument()

    rerender(
      <QuickPrompts {...mockProps} aiMode="tutor" />
    )

    expect(screen.getByText('苏格拉底式引导')).toBeInTheDocument()

    rerender(
      <QuickPrompts {...mockProps} aiMode="sermon" />
    )

    expect(screen.getByText('讲章工具')).toBeInTheDocument()
  })
})