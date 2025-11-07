import { Suspense } from 'react'

import CuidarClient from '@/app/(tabs)/cuidar/Client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page() {
  return <Suspense fallback={<div className="p-4">Loading…</div>}><CuidarClient /></Suspense>
}
