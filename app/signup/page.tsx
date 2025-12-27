import { Suspense } from 'react'
import SignupClient from './SignupClient'
import { AuthShell } from '@/components/common/AuthShell'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva poucos passos. O Materna360 funciona no seu ritmo."
    >
      <Suspense fallback={null}>
        <SignupClient />
      </Suspense>
    </AuthShell>
  )
}
