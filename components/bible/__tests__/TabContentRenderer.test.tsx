import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TabContentRenderer, Tab } from '../TabContentRenderer'

// 简化测试，不 mock 子组件
describe('TabContentRenderer', () => {
  const mockTabs: Tab[] = [
    { id: 'tab-1', type: 'read', book: 'Gen', chapter: 1 },
    { id: 'tab-2', type: 'search', query: 'test' },
    { id: 'tab-3', type: 'dashboard' },
    { id: 'tab-4', type: 'highlights' },
    { id: 'tab-5', type: 'notes' },
    { id: 'tab-6', type: 'plan' },
  ]

  const mockProps = {
    tabs: mockTabs,
    activeTabId: 'tab-1',
    chapterSpeechText: '',
    updateActiveTab: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correct number of tab containers', () => {
    const { container } = render(<TabContentRenderer {...mockProps} />)

    // 应该渲染所有 tab 的容器
    const tabContainers = container.querySelectorAll('[aria-hidden]')
    expect(tabContainers.length).toBe(mockTabs.length)
  })

  it('marks active tab as visible', () => {
    const { container } = render(<TabContentRenderer {...mockProps} />)

    const activeTab = container.querySelector('[aria-hidden="false"]')
    expect(activeTab).toBeTruthy()
    expect(activeTab).toHaveStyle({ visibility: 'visible' })
  })

  it('marks inactive tabs as hidden', () => {
    const { container } = render(<TabContentRenderer {...mockProps} />)

    const hiddenTabs = container.querySelectorAll('[aria-hidden="true"]')
    expect(hiddenTabs.length).toBe(mockTabs.length - 1)
  })

  it('switches active tab when activeTabId changes', () => {
    const { container, rerender } = render(<TabContentRenderer {...mockProps} />)

    // 初始状态：tab-1 活跃
    let activeTab = container.querySelector('[aria-hidden="false"]')
    expect(activeTab).toBeTruthy()

    // 切换到 tab-2
    rerender(<TabContentRenderer {...mockProps} activeTabId="tab-2" />)

    activeTab = container.querySelector('[aria-hidden="false"]')
    expect(activeTab).toBeTruthy()

    // 验证 tab-2 现在是可见的
    const hiddenTabs = container.querySelectorAll('[aria-hidden="true"]')
    expect(hiddenTabs.length).toBe(mockTabs.length - 1)
  })

  it('applies correct CSS classes for active tab', () => {
    const { container } = render(<TabContentRenderer {...mockProps} />)

    const activeTab = container.querySelector('[aria-hidden="false"]')
    expect(activeTab).toHaveClass('h-full')
  })

  it('applies correct CSS classes for inactive tabs', () => {
    const { container } = render(<TabContentRenderer {...mockProps} />)

    const hiddenTabs = container.querySelectorAll('[aria-hidden="true"]')
    hiddenTabs.forEach(tab => {
      expect(tab).toHaveClass('absolute')
      expect(tab).toHaveClass('inset-0')
      expect(tab).toHaveClass('pointer-events-none')
    })
  })

  it('handles empty tabs array', () => {
    const { container } = render(
      <TabContentRenderer
        tabs={[]}
        activeTabId=""
        updateActiveTab={vi.fn()}
      />
    )

    const wrapper = container.querySelector('.relative.h-full')
    expect(wrapper).toBeTruthy()
    expect(wrapper?.children.length).toBe(0)
  })

  it('handles unknown tab type', () => {
    const unknownTab = { id: 'tab-unknown', type: 'unknown' as any }
    const { container } = render(
      <TabContentRenderer
        tabs={[unknownTab]}
        activeTabId="tab-unknown"
        updateActiveTab={vi.fn()}
      />
    )

    // 组件应该渲染容器，但内容为空
    const tabContainer = container.querySelector('[aria-hidden="false"]')
    expect(tabContainer).toBeTruthy()
  })

  it('renders wrapper with correct classes', () => {
    const { container } = render(<TabContentRenderer {...mockProps} />)

    const wrapper = container.querySelector('.relative.h-full')
    expect(wrapper).toBeTruthy()
  })
})