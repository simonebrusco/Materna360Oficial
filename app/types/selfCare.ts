import type { SelfCareT } from '@/app/lib/discoverSchemas'

export type SelfCareEnergy = SelfCareT['energyFit'][number]

export type SelfCare = SelfCareT

export type SelfCareProps = {
  cues: { energy: SelfCareEnergy }
  selectedTime: 2 | 5 | 10
  dateKey: string
  selfCareCMS: SelfCare[]
  flags: { selfCare: boolean; selfCareAI?: boolean }
}
