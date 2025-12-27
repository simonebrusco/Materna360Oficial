import { Suspense } from 'react'
import LoginClient from './LoginClient'
import AuthShell from '@/components/common/AuthShell'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <LoginClient />
      </Suspense>
    </AuthShell>
  )
}
