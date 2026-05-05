"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

export default function NotFound() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="text-6xl mb-4">📖</div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">404</h1>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="text-6xl mb-4">📖</div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">
        {t('common.notFoundTitle')}
      </h1>
      <p className="text-muted-foreground mb-6 text-center">
        {t('common.notFoundDesc')}
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        {t('common.backToHome')}
      </Link>
    </div>
  )
}
