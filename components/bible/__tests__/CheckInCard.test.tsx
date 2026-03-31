import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CheckInCard } from '../CheckInCard'

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn(() => Promise.resolve('data:image/png;base64,mock')),
}))

describe('CheckInCard', () => {
  const mockProps = {
    streakDays: 7,
    todayVerse: '约翰福音 3:16',
    todayChapter: '约翰福音第3章',
    userName: '测试用户',
    onShare: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders check-in card with streak count', () => {
    render(<CheckInCard {...mockProps} />)

    expect(screen.getByText('连续打卡')).toBeInTheDocument()
    expect(screen.getByText('7天')).toBeInTheDocument()
  })

  it('displays today verse reference', () => {
    render(<CheckInCard {...mockProps} />)

    expect(screen.getByText(/约翰福音 3:16/)).toBeInTheDocument()
  })

  it('shows chapter completion message', () => {
    render(<CheckInCard {...mockProps} />)

    expect(screen.getByText(/约翰福音第3章/)).toBeInTheDocument()
  })

  it('renders share button', () => {
    render(<CheckInCard {...mockProps} />)

    expect(screen.getByText('分享')).toBeInTheDocument()
  })

  it('calls onShare when share button clicked', async () => {
    render(<CheckInCard {...mockProps} />)

    const shareButton = screen.getByText('分享')
    fireEvent.click(shareButton)

    // Wait for image generation
    await vi.waitFor(() => {
      expect(mockProps.onShare).toHaveBeenCalled()
    })
  })

  it('renders close button', () => {
    render(<CheckInCard {...mockProps} />)

    expect(screen.getByText('关闭')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    render(<CheckInCard {...mockProps} />)

    const closeButton = screen.getByText('关闭')
    fireEvent.click(closeButton)

    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('displays user name', () => {
    render(<CheckInCard {...mockProps} />)

    expect(screen.getByText(/测试用户/)).toBeInTheDocument()
  })

  it('shows encouragement message based on streak', () => {
    render(<CheckInCard {...mockProps} streakDays={30} />)

    // Should show special message for 30 days
    expect(screen.getByText(/坚持/)).toBeInTheDocument()
  })

  it('renders with different streak levels correctly', () => {
    const { rerender } = render(<CheckInCard {...mockProps} streakDays={1} />)
    expect(screen.getByText('1天')).toBeInTheDocument()

    rerender(<CheckInCard {...mockProps} streakDays={100} />)
    expect(screen.getByText('100天')).toBeInTheDocument()
  })
})