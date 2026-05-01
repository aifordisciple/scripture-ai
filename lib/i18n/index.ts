import { zh } from './zh'
import { en } from './en'
import type { Translations } from './zh'
import { useBibleStore } from '@/store/useBibleStore'

export type Locale = 'zh' | 'en'

const translations: Record<Locale, Translations> = { zh, en }

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : undefined
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  )
}

export function t(key: string, params?: Record<string, string | number>): string {
  const locale = useBibleStore.getState().locale
  const dict = translations[locale] || translations.zh
  const value = getNestedValue(dict as unknown as Record<string, unknown>, key)
  if (value) return interpolate(value, params)

  // Fallback: if key is missing in current locale, try zh (primary locale)
  if (locale !== 'zh') {
    const zhValue = getNestedValue(translations.zh as unknown as Record<string, unknown>, key)
    if (zhValue) return interpolate(zhValue, params)
  }

  // Last resort: return the key path so users see something meaningful
  return key
}

export function useTranslation() {
  const locale = useBibleStore((state) => state.locale)
  return {
    t,
    locale,
  }
}

export function resolveDualLang(v: { zh: string; en: string } | string, locale: Locale): string {
  return typeof v === 'string' ? v : (v[locale] || v.zh)
}

export type { Translations }
