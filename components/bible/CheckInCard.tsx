'use client'

import { memo, useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { Flame, BookOpen, Calendar, X, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface CheckInCardProps {
  streakDays: number
  todayVerse: string
  todayChapter: string
  userName: string
  onShare?: (imageUrl: string) => void
  onClose?: () => void
}

// 获取鼓励语
function getEncouragement(streakDays: number): string {
  if (streakDays >= 100) return '太厉害了！百日坚持，灵命成长！'
  if (streakDays >= 30) return '一个月坚持！继续保持！'
  if (streakDays >= 14) return '两周坚持！习惯养成中！'
  if (streakDays >= 7) return '一周坚持！神与你同在！'
  if (streakDays >= 3) return '三天打卡！继续加油！'
  return '今日读经，神恩满满！'
}

// 获取火焰颜色
function getFlameColor(streakDays: number): string {
  if (streakDays >= 100) return 'text-amber-500'
  if (streakDays >= 30) return 'text-orange-500'
  if (streakDays >= 7) return 'text-red-500'
  return 'text-blue-500'
}

export const CheckInCard = memo(function CheckInCard({
  streakDays,
  todayVerse,
  todayChapter,
  userName,
  onShare,
  onClose,
}: CheckInCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.9,
        pixelRatio: 2,
      })

      onShare?.(dataUrl)
    } catch (error) {
      console.error('[CheckIn] Failed to generate image:', error)
    }
  }, [onShare])

  const encouragement = getEncouragement(streakDays)
  const flameColor = getFlameColor(streakDays)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-w-sm w-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-lg"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>

        {/* Card content - for image generation */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm mb-3">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <h2 className="text-2xl font-bold">今日打卡成功</h2>
          </div>

          {/* Streak display */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex flex-col items-center">
              <div className={cn('relative', flameColor)}>
                <Flame className="w-16 h-16 fill-current animate-pulse" />
                {streakDays >= 7 && (
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                    {streakDays}
                  </span>
                )}
              </div>
              <span className="text-sm mt-1 opacity-80">连续打卡</span>
            </div>
            <div className="text-4xl font-bold">{streakDays}天</div>
          </div>

          {/* Today's reading */}
          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm opacity-80">今日读经</span>
            </div>
            <p className="font-bold text-lg">{todayChapter}</p>
            {todayVerse && (
              <p className="text-sm opacity-80 mt-1">{todayVerse}</p>
            )}
          </div>

          {/* Encouragement */}
          <div className="text-center mb-4">
            <p className="text-lg font-medium">{encouragement}</p>
          </div>

          {/* User signature */}
          <div className="text-center text-sm opacity-60">
            <p>{userName} · AI读</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            关闭
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
            分享
          </Button>
        </div>
      </div>
    </div>
  )
})

CheckInCard.displayName = 'CheckInCard'