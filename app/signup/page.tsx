cat > app/signup/page.tsx <<'EOF'
import { Suspense } from 'react'
import SignupClient from './SignupClient'
import AuthShell from '@/components/common/AuthShell'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <AuthShell>
        <SignupClient />
      </AuthShell>
    </Suspense>
  )
}
EOF
