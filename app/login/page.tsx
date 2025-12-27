import { Suspense } from 'react'
import LoginClient from './LoginClient'
import { AuthShell } from '@/components/common/AuthShell'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <AuthShell
      title="Entrar"
      subtitle="Um acesso rápido, sem complicação."
      footer={<span>Se for seu primeiro acesso, você pode criar sua conta.</span>}
    >
      <Suspense fallback={null}>
        <LoginClient />
      </Suspense>
    </AuthShell>
  )
}
