import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SessionSelector } from '../SessionSelector'
import type { ChatSession } from '@/store/types'

// Mock dependencies
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

const mockSessions: ChatSession[] = [
  {
    id: 'session-1',
    userId: 'user-1',
    title: '创世记第1章',
    mode: 'general',
    messages: [],
    createdAt: new Date('2026-03-30'),
    updatedAt: new Date('2026-03-30'),
  },
  {
    id: 'session-2',
    userId: 'user-1',
    title: '约翰福音3:16',
    mode: 'tutor',
    messages: [],
    createdAt: new Date('2026-03-29'),
    updatedAt: new Date('2026-03-29'),
  },
  {
    id: 'session-3',
    userId: 'user-1',
    title: '诗篇23篇',
    mode: 'general',
    messages: [],
    createdAt: new Date('2026-03-28'),
    updatedAt: new Date('2026-03-28'),
  },
  {
    id: 'session-4',
    userId: 'user-1',
    title: '罗马书8章',
    mode: 'sermon',
    messages: [],
    createdAt: new Date('2026-03-27'),
    updatedAt: new Date('2026-03-27'),
  },
]

describe('SessionSelector', () => {
  const mockProps = {
    sessions: mockSessions,
    currentSessionId: 'session-1',
    showSessionList: false,
    onToggleSessionList: vi.fn(),
    onSelectSession: vi.fn(),
    onNewSession: vi.fn(),
    onDeleteSession: vi.fn(),
    onRenameSession: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders current session title', () => {
    render(<SessionSelector {...mockProps} />)

    expect(screen.getByText('创世记第1章')).toBeInTheDocument()
  })

  it('shows "新对话" when no current session', () => {
    render(
      <SessionSelector
        {...mockProps}
        currentSessionId={null}
      />
    )

    expect(screen.getByText('新对话')).toBeInTheDocument()
  })

  it('toggles session list on click', () => {
    render(<SessionSelector {...mockProps} />)

    const button = screen.getByRole('button', { name: '切换会话' })
    fireEvent.click(button)

    expect(mockProps.onToggleSessionList).toHaveBeenCalled()
  })

  it('shows session list when showSessionList is true', () => {
    render(
      <SessionSelector
        {...mockProps}
        showSessionList={true}
      />
    )

    expect(screen.getByText('新建对话')).toBeInTheDocument()
    expect(screen.getByText('约翰福音3:16')).toBeInTheDocument()
  })

  it('calls onNewSession when new button clicked', () => {
    render(
      <SessionSelector
        {...mockProps}
        showSessionList={true}
      />
    )

    const newButton = screen.getByText('新建对话')
    fireEvent.click(newButton)

    expect(mockProps.onNewSession).toHaveBeenCalled()
  })

  it('filters sessions by search query', async () => {
    render(
      <SessionSelector
        {...mockProps}
        showSessionList={true}
      />
    )

    const searchInput = screen.getByPlaceholderText('搜索对话...')
    fireEvent.change(searchInput, { target: { value: '约翰' } })

    // 验证约翰福音3:16 在列表中
    expect(screen.getByText('约翰福音3:16')).toBeInTheDocument()
    // 验证创世记第1章不在会话列表中（但可能在按钮标题中）
    // 检查会话列表区域内的标题
    const sessionItems = document.querySelectorAll('.p-2.space-y-1 > div')
    expect(sessionItems.length).toBe(1) // 只有一个匹配的会话
  })
})