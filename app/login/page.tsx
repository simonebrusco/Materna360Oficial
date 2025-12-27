import { Suspense } from 'react'
import LoginClient from './LoginClient'
import { AuthShell } from '@/components/common/AuthShell'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <AuthShell
      title="Entrar"
      subtitle="Um espaço leve para retomar seu ritmo, sem cobrança."
      footer={
        <span>
          Se preferir, você pode criar sua conta em poucos segundos.
        </span>
      }
    >
      <Suspense fallback={null}>
        <LoginClient />
      </Suspense>
    </AuthShell>
  )
}
