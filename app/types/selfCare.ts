export type SelfCareEnergy = 'exausta' | 'normal' | 'animada'

export type SelfCare = {
  id: string
  title: string
  minutes: 2 | 5 | 10
  energyFit: SelfCareEnergy[]
  steps: string[]
  tip?: string
  image?: string
  active: boolean
  sortWeight?: number
  createdAt?: string
}

export type SelfCareProps = {
  cues: { energy: SelfCareEnergy }
  selectedTime: 2 | 5 | 10
  dateKey: string
  selfCareCMS: SelfCare[]
  flags: { selfCare: boolean; selfCareAI?: boolean }
}
