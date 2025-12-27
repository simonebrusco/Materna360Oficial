import { Suspense } from 'react'
import LoginClient from './LoginClient'
import AuthShell from '@/components/common/AuthShell'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthShell
        title="Entrar"
        subtitle="Um acesso simples, sem pressão. Você retoma de onde parou."
      >
        <LoginClient />
      </AuthShell>
    </Suspense>
  )
}
