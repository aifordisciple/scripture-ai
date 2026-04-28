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
import type { Translations } from '../zh'

export const en: Translations = {
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
}
