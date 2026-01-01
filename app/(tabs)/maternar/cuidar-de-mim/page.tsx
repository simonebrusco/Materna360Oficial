// app/(tabs)/maternar/cuidar-de-mim/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import PageTemplate from '@/components/common/PageTemplate'
import Client from './Client'

export const metadata: Metadata = {
  title: 'Cuidar de Mim | Materna360',
  description: 'Um espaço curto para respirar um pouco — sem obrigação, sem cobrança.',
}

export default function Page() {
  return (
    <PageTemplate
      headerTone="light"
      label="MATERNAR"
      title="Cuidar de Mim"
      subtitle="Um espaço curto para você respirar um pouco — sem obrigação, sem cobrança."
      headerTop={
        <Link
          href="/maternar"
          className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition"
        >
          <span className="mr-1.5 text-lg leading-none">←</span>
          Voltar para o Maternar
        </Link>
      }
      showLabel={false}
    >
      <Client />
    </PageTemplate>
  )
}
