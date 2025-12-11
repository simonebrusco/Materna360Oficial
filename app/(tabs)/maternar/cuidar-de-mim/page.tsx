import CuidarDeMimClient from './Client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Cuidar de Mim | Materna360',
  description:
    'Pequenos gestos de autocuidado que cabem no seu dia, com leveza e acolhimento.',
}

export default function CuidarDeMimPage() {
  return <CuidarDeMimClient />
}
