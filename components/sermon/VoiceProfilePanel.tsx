'use client'

import React, { useCallback } from 'react'
import { Mic, Info } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import type { VoiceTone, VoiceFormality, VoiceAudience, VoiceProfile } from '@/store/types'

/** Tone options with labels and descriptions */
const TONE_OPTIONS: { value: VoiceTone; zh: string; en: string; zhDesc: string; enDesc: string }[] = [
  { value: 'solemn', zh: '庄重', en: 'Solemn', zhDesc: '庄严、敬畏、神圣', enDesc: 'Majestic, reverent, sacred' },
  { value: 'warm', zh: '亲切', en: 'Warm', zhDesc: '温暖、关怀、贴近', enDesc: 'Warm, caring, approachable' },
  { value: 'passionate', zh: '激昂', en: 'Passionate', zhDesc: '充满热情、激励人心', enDesc: 'Energetic, inspiring, fervent' },
  { value: 'gentle', zh: '温柔', en: 'Gentle', zhDesc: '柔和、安慰、医治', enDesc: 'Soft, comforting, healing' },
  { value: 'scholarly', zh: '学术', en: 'Scholarly', zhDesc: '严谨、深入、思辨', enDesc: 'Rigorous, deep, analytical' },
  { value: 'conversational', zh: '对话式', en: 'Conversational', zhDesc: '轻松、互动、日常', enDesc: 'Relaxed, interactive, everyday' },
]

const FORMALITY_OPTIONS: { value: VoiceFormality; zh: string; en: string }[] = [
  { value: 'formal', zh: '正式', en: 'Formal' },
  { value: 'semi-formal', zh: '半正式', en: 'Semi-formal' },
  { value: 'casual', zh: '随意', en: 'Casual' },
]

const AUDIENCE_OPTIONS: { value: VoiceAudience; zh: string; en: string }[] = [
  { value: 'general', zh: '一般会众', en: 'General' },
  { value: 'youth', zh: '青年', en: 'Youth' },
  { value: 'elderly', zh: '长者', en: 'Elderly' },
  { value: 'scholarly', zh: '学者', en: 'Scholarly' },
  { value: 'new-believer', zh: '初信者', en: 'New believer' },
]

/**
 * VoiceProfilePanel — 语音特征配置面板
 *
 * Features:
 * - Tone selection (6 options with descriptions)
 * - Formality level (3 levels)
 * - Target audience (5 types)
 * - Custom voice description textarea
 * - Preview of current voice profile
 */
export function VoiceProfilePanel() {
  const { locale } = useTranslation()
  const isZh = locale !== 'en'

  const { voiceProfile, setVoiceProfile } = useBibleStore()

  const updateProfile = useCallback(<K extends keyof VoiceProfile>(key: K, value: VoiceProfile[K]) => {
    setVoiceProfile({ ...voiceProfile, [key]: value })
  }, [voiceProfile, setVoiceProfile])

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <Mic size={12} className="text-blue-500" />
        <span className="text-xs font-medium text-foreground">
          {isZh ? '语音特征' : 'Voice Profile'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Tone selection */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {isZh ? '语气风格' : 'Tone'}
          </label>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {TONE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateProfile('tone', opt.value)}
                className={`
                  px-2 py-1.5 rounded text-left transition-colors
                  ${voiceProfile.tone === opt.value
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700'
                    : 'bg-muted/30 text-foreground/70 hover:bg-muted/50'
                  }
                `}
              >
                <div className="text-[11px] font-medium">{isZh ? opt.zh : opt.en}</div>
                <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                  {isZh ? opt.zhDesc : opt.enDesc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Formality */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {isZh ? '正式程度' : 'Formality'}
          </label>
          <div className="flex gap-1 mt-1">
            {FORMALITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateProfile('formality', opt.value)}
                className={`
                  flex-1 px-2 py-1 rounded text-[11px] transition-colors
                  ${voiceProfile.formality === opt.value
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-muted/30 text-foreground/70 hover:bg-muted/50'
                  }
                `}
              >
                {isZh ? opt.zh : opt.en}
              </button>
            ))}
          </div>
        </div>

        {/* Audience */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {isZh ? '目标听众' : 'Audience'}
          </label>
          <div className="flex flex-wrap gap-1 mt-1">
            {AUDIENCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateProfile('audience', opt.value)}
                className={`
                  px-2 py-1 rounded text-[11px] transition-colors
                  ${voiceProfile.audience === opt.value
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-muted/30 text-foreground/70 hover:bg-muted/50'
                  }
                `}
              >
                {isZh ? opt.zh : opt.en}
              </button>
            ))}
          </div>
        </div>

        {/* Custom description */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {isZh ? '自定义描述' : 'Custom Description'}
          </label>
          <textarea
            value={voiceProfile.description || ''}
            onChange={(e) => updateProfile('description', e.target.value)}
            placeholder={isZh ? '描述你期望的讲章语气风格...' : 'Describe your desired sermon voice...'}
            className="w-full mt-1 px-2 py-1.5 rounded text-xs bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
            rows={2}
          />
        </div>

        {/* Info hint */}
        <div className="flex items-start gap-1.5 px-2 py-1.5 rounded bg-blue-50/50 dark:bg-blue-900/10">
          <Info size={10} className="text-blue-500 mt-0.5 shrink-0" />
          <span className="text-[10px] text-blue-600 dark:text-blue-400 leading-tight">
            {isZh
              ? '语音特征将影响AI生成讲章的语气和风格。建议在开始写作前设定。'
              : 'Voice profile affects AI-generated sermon tone and style. Best set before writing.'}
          </span>
        </div>
      </div>
    </div>
  )
}
