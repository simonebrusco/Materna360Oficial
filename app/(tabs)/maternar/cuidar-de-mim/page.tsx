// app/(tabs)/maternar/cuidar-de-mim/page.tsx
import { Metadata } from 'next'
import Client from './Client'

export const metadata: Metadata = {
  title: 'Cuidar de Mim | Materna360',
  description:
    'Pequenos gestos de autocuidado, leveza e serenidade para você respirar e se cuidar no seu ritmo.',
}

export default function Page() {
  return <Client />
}
