"use client"

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DesktopLoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Desktop Login Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-5xl">⚠️</div>
      <h2 className="text-xl font-semibold text-foreground">登录出错</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        {error.message || '桌面端登录时发生错误，请重试。'}
      </p>
      <Button onClick={reset} variant="outline">
        重试
      </Button>
    </div>
  )
}
