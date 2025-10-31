'use server'

import { cookies } from 'next/headers'
import { noStore } from 'next/cache'
import type { ReactNode } from 'react'

import { getProfile } from '@/app/lib/profileServer'
import { getRecShelfWithFallback, getQuickIdeasWithFallback } from '@/app/lib/cmsFallback'
import { getFlashRoutineWithFallback } from '@/app/lib/cmsFallback'
import { getSelfCareWithFallback } from '@/app/lib/cmsFallback'
import { buildRecShelves } from '@/app/lib/recShelf'
import { getServerFlags } from '@/app/lib/flags'
import '@/app/lib/telemetryServer'
import DescobrirClient from './Client'

type SearchParams = {
  ageFilter?: string | string[]
  placeFilter?: string | string[]
}

export default async function DescobrirPage({ searchParams }: { searchParams?: SearchParams }) {
  noStore()

  const jar = cookies()
  const profile = await getProfile(jar)
  const flags = await getServerFlags(jar)

  const [recShelf, quickIdeas, flashRoutine, selfCare] = await Promise.all([
    getRecShelfWithFallback(),
    getQuickIdeasWithFallback(),
    getFlashRoutineWithFallback(),
    getSelfCareWithFallback(),
  ])

  const builtRecShelves = buildRecShelves(recShelf, profile, flags)

  return (
    <DescobrirClient
      initialProfile={profile}
      initialQuickIdeas={quickIdeas}
      initialFlashRoutine={flashRoutine}
      initialSelfCare={selfCare}
      initialRecShelves={builtRecShelves}
      initialSearchParams={searchParams}
      flags={flags}
    />
  )
}
