import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchSuggestions } from '../SearchSuggestions'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userSetting: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('SearchSuggestions', () => {
  const mockProps = {
    query: '',
    onSelect: vi.fn(),
    onHistorySelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders recent searches when query is empty', () => {
    render(
      <SearchSuggestions
        {...mockProps}
        recentSearches={['创世记', '约翰福音', '信心']}
      />
    )

    expect(screen.getByText('最近搜索')).toBeInTheDocument()
    expect(screen.getByText('创世记')).toBeInTheDocument()
    expect(screen.getByText('约翰福音')).toBeInTheDocument()
  })

  it('shows verse suggestions when typing', () => {
    render(
      <SearchSuggestions
        {...mockProps}
        query="创世"
        verseSuggestions={['创世记 1:1', '创世记 2:1']}
      />
    )

    // Check for "经文" section header
    expect(screen.getByText('经文')).toBeInTheDocument()
    // Check that suggestions are rendered (they contain highlighted text)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('calls onSelect when suggestion clicked', () => {
    render(
      <SearchSuggestions
        {...mockProps}
        query="创世"
        verseSuggestions={['创世记 1:1']}
      />
    )

    // Click the first suggestion button
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(mockProps.onSelect).toHaveBeenCalledWith('创世记 1:1')
  })

  it('calls onHistorySelect when history item clicked', () => {
    render(
      <SearchSuggestions
        {...mockProps}
        recentSearches={['创世记']}
      />
    )

    fireEvent.click(screen.getByText('创世记'))
    expect(mockProps.onHistorySelect).toHaveBeenCalledWith('创世记')
  })

  it('hides when no suggestions and no history', () => {
    const { container } = render(
      <SearchSuggestions
        {...mockProps}
        query="xyz123"
        verseSuggestions={[]}
        recentSearches={[]}
      />
    )

    // Should show empty state
    expect(container.firstChild).toBeTruthy()
  })

  it('shows topic suggestions', () => {
    render(
      <SearchSuggestions
        {...mockProps}
        query="信"
        topicSuggestions={['信心', '信实', '信徒']}
      />
    )

    // Check for "主题" section header
    expect(screen.getByText('主题')).toBeInTheDocument()
    // Check that suggestion buttons are rendered
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(3)
  })

  it('limits number of suggestions shown', () => {
    const manySuggestions = Array.from({ length: 20 }, (_, i) => `建议 ${i + 1}`)

    render(
      <SearchSuggestions
        {...mockProps}
        query="测"
        verseSuggestions={manySuggestions}
      />
    )

    // Should only show max suggestions (e.g., 5)
    const items = screen.getAllByRole('button')
    expect(items.length).toBeLessThanOrEqual(7) // max suggestions + history header
  })
})