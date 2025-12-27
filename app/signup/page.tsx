import { Suspense } from 'react'
import SignupClient from './SignupClient'
import AuthShell from '@/components/common/AuthShell'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <SignupClient />
      </Suspense>
    </AuthShell>
  )
}
