// app/(tabs)/maternar/cuidar-de-mim/page.tsx
import { Metadata } from 'next'
import Client from './Client'

export const metadata: Metadata = {
  title: 'Cuidar de Mim | Materna360',
  description:
    'Um ajuste curto e prático para aliviar o peso do momento e seguir o dia com mais clareza — sem cobrança.',
}

export default function Page() {
  return <Client />
}
