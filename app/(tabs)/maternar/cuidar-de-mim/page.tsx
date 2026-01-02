// app/(tabs)/maternar/cuidar-de-mim/page.tsx
import type { Metadata } from 'next'
import Client from './Client'

export const metadata: Metadata = {
  title: 'Cuidar de Mim | Materna360',
  description: 'Um espaço curto para respirar um pouco — sem obrigação, sem cobrança.',
}

export default function Page() {
  return <Client />
}
