import { common } from './common'
import { reader } from './reader'
import { ai } from './ai'
import { plan } from './plan'
import { settings } from './settings'
import { search } from './search'
import { auth } from './auth'
import { group } from './group'
import { atlas } from './atlas'
import { highlights } from './highlights'
import { shareCard } from './shareCard'
import type { DeepStringify } from '../types'

export const zh = {
  ...common,
  ...reader,
  ...ai,
  ...plan,
  ...settings,
  ...search,
  ...auth,
  ...group,
  ...atlas,
  ...highlights,
  ...shareCard,
} as const

export type Translations = DeepStringify<typeof zh>
