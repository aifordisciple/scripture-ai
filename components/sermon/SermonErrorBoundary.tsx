'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class SermonErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SermonErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-destructive text-sm font-medium mb-2">
            讲章编辑器加载失败
          </div>
          <div className="text-muted-foreground text-xs mb-4 max-w-md break-all">
            {this.state.error?.message || '未知错误'}
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
            <pre className="text-[10px] text-muted-foreground/70 mb-4 max-w-lg max-h-32 overflow-auto bg-muted/30 p-2 rounded text-left">
              {this.state.error.stack.split('\n').slice(0, 8).join('\n')}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          >
            重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}