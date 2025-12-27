import { Suspense } from 'react'
import SignupClient from './SignupClient'
import { AuthShell } from '@/components/common/AuthShell'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <AuthShell
      title="Criar sua conta"
      subtitle="Um primeiro passo simples para organizar o seu dia com leveza."
      footer={<span>Já tem conta? Você pode entrar quando quiser.</span>}
    >
      <Suspense fallback={null}>
        <SignupClient />
      </Suspense>
    </AuthShell>
  )
}
