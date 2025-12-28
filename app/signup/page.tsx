import { Suspense } from 'react'
import SignupClient from './SignupClient'
import AuthShell from '@/components/common/AuthShell'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Uma conta só para manter sua rotina mais leve."
    >
      <Suspense fallback={null}>
        <SignupClient />
      </Suspense>
    </AuthShell>
  )
}
