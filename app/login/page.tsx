cat > app/login/page.tsx <<'EOF'
import { Suspense } from 'react'
import LoginClient from './LoginClient'
import AuthShell from '@/components/common/AuthShell'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthShell>
        <LoginClient />
      </AuthShell>
    </Suspense>
  )
}
EOF
