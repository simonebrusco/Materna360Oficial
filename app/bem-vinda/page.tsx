import { Suspense } from 'react'
import BemVindaClient from './BemVindaClient'

export const dynamic = 'force-dynamic'

export default function BemVindaPage() {
  return (
    <Suspense fallback={null}>
      <BemVindaClient />
    </Suspense>
  )
}
