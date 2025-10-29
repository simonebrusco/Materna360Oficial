export type DiscoverFlags = {
  recShelf?: boolean
  flashRoutine?: boolean
  flashRoutineAI?: boolean
  selfCare?: boolean
  selfCareAI?: boolean
  [key: string]: boolean | undefined
}

export function getServerFlags(options: {
  cookies?: (name: string) => string | undefined
  searchParams?: Record<string, any>
}): DiscoverFlags {
  return {
    recShelf: true,
    flashRoutine: true,
    flashRoutineAI: true,
    selfCare: true,
    selfCareAI: true,
  }
}

export function getClientFlags(): DiscoverFlags {
  return {
    recShelf: true,
    flashRoutine: true,
    flashRoutineAI: true,
    selfCare: true,
    selfCareAI: true,
  }
}
