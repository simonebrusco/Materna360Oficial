import type { QuickIdeasAgeBucket as AgeBucket, QuickIdeasLocation as LocaleFit } from '@/app/types/quickIdeas'

export type IdeaLite = {
  id: string
  title: string
  durationMin: number
  materials: string[]
  steps: string[]
  safetyNotes?: string[]
  ageBuckets: AgeBucket[]
  locales: LocaleFit[]
  tags?: string[]
}

export type FlashRoutineStep = {
  title: string
  minutes: number
  ideaId?: string
}

export type FlashRoutine = {
  id: string
  title: string
  totalMin: number
  steps: FlashRoutineStep[]
  ageBucket: AgeBucket
  locale: LocaleFit
  materials: string[]
  safetyNotes?: string[]
  active: boolean
}

export type FlashRoutineProps = {
  profile: {
    mode: 'single' | 'all'
    children: Array<{ id: string; name?: string; age_bucket: AgeBucket }>
  }
  filters: {
    locale: LocaleFit
    time_window_min: number
    energy: 'exausta' | 'normal' | 'animada'
  }
  dateKey: string
  ideasCatalog: IdeaLite[]
  routinesCMS: FlashRoutine[]
  flags: {
    flashRoutine: boolean
    flashRoutineAI: boolean
  }
}
