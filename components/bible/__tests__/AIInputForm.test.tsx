import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AIInputForm } from '../AIInputForm'

describe('AIInputForm', () => {
  const mockProps = {
    input: '',
    isLoading: false,
    onInputChange: vi.fn(),
    onSubmit: vi.fn(),
    onStop: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders input field', () => {
    render(<AIInputForm {...mockProps} />)

    expect(screen.getByPlaceholderText('追问...')).toBeInTheDocument()
  })

  it('calls onInputChange when typing', () => {
    render(<AIInputForm {...mockProps} />)

    const input = screen.getByPlaceholderText('追问...')
    fireEvent.change(input, { target: { value: '测试输入' } })

    expect(mockProps.onInputChange).toHaveBeenCalled()
  })

  it('calls onSubmit when form submitted', () => {
    render(
      <AIInputForm
        {...mockProps}
        input="测试问题"
      />
    )

    const form = screen.getByRole('form')
    fireEvent.submit(form)

    expect(mockProps.onSubmit).toHaveBeenCalled()
  })

  it('disables submit when input is empty', () => {
    render(<AIInputForm {...mockProps} />)

    const submitButton = screen.getByRole('button', { name: '发送' })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit when input has content', () => {
    render(
      <AIInputForm
        {...mockProps}
        input="测试问题"
      />
    )

    const submitButton = screen.getByRole('button', { name: '发送' })
    expect(submitButton).not.toBeDisabled()
  })

  it('shows stop button when loading', () => {
    render(
      <AIInputForm
        {...mockProps}
        isLoading={true}
      />
    )

    expect(screen.getByRole('button', { name: '停止' })).toBeInTheDocument()
  })

  it('calls onStop when stop button clicked', () => {
    render(
      <AIInputForm
        {...mockProps}
        isLoading={true}
      />
    )

    const stopButton = screen.getByRole('button', { name: '停止' })
    fireEvent.click(stopButton)

    expect(mockProps.onStop).toHaveBeenCalled()
  })

  it('disables input when loading', () => {
    render(
      <AIInputForm
        {...mockProps}
        isLoading={true}
      />
    )

    const input = screen.getByPlaceholderText('追问...')
    expect(input).toBeDisabled()
  })

  it('renders disclaimer text', () => {
    render(<AIInputForm {...mockProps} />)

    expect(screen.getByText(/AI 辅助仅供参考/)).toBeInTheDocument()
  })
})