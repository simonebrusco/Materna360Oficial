import { Suspense } from 'react'
import RecoverPasswordClient from './RecoverPasswordClient'

export const dynamic = 'force-dynamic'

export default function RecoverPasswordPage() {
  return (
    <Suspense fallback={null}>
      <RecoverPasswordClient />
    </Suspense>
  )
}
