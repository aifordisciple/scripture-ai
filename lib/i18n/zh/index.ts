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
import { onboarding } from './onboarding'
import { dm } from './dm'
import { mindmap } from './mindmap'
import { adminFeedback } from './adminFeedback'
import { shortcuts } from './shortcuts'
import { feedback } from './feedback'
import { bible } from './bible'
import { admin } from './admin'
import { pwa } from './pwa'
import dashboard from './dashboard'
import { sermon } from './sermon'
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
  ...onboarding,
  ...dm,
  ...mindmap,
  ...adminFeedback,
  ...shortcuts,
  ...feedback,
  ...bible,
  ...admin,
  ...pwa,
  dashboard,
  ...sermon,
} as const

export type Translations = DeepStringify<typeof zh>
