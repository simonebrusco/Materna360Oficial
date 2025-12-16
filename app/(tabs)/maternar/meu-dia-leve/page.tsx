import MeuDiaLeveClient from './Client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Meu Dia Leve | Materna360',
  description:
    'Frases, ideias e pequenos gestos para tornar o dia mais leve, dentro da sua realidade.',
}

export default function MeuDiaLevePage() {
  return <MeuDiaLeveClient />
}
