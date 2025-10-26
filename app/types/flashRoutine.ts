import type {
  FlashRoutineFiltersT,
  FlashRoutineT,
  IdeaLiteT,
  ProfileSummaryT,
} from '@/app/lib/discoverSchemas'

export type IdeaLite = IdeaLiteT
export type FlashRoutine = FlashRoutineT
export type FlashRoutineStep = FlashRoutine['steps'][number]

export type FlashRoutineProps = {
  profile: ProfileSummaryT
  filters: FlashRoutineFiltersT
  dateKey: string
  ideasCatalog: IdeaLite[]
  routinesCMS: FlashRoutine[]
  flags: {
    flashRoutine: boolean
    flashRoutineAI: boolean
  }
}
