cat > components/common/AuthShell.tsx <<'EOF'
'use client'

import Image from 'next/image'
import LegalFooter from '@/components/common/LegalFooter'

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen w-full bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_35%,#fdbed7_70%,#fff7fa_100%)] flex flex-col items-center justify-center px-4">
      <div className="mb-8 flex flex-col items-center">
        <Image src="/images/LogoBranco.png" alt="Materna360" width={180} height={56} priority />
      </div>

      <div className="w-full max-w-[420px]">{children}</div>

      <div className="mt-10 opacity-70">
        <LegalFooter />
      </div>
    </main>
  )
}
EOF
