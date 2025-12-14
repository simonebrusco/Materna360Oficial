import MeuFilhoClient from './Client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Meu Filho | Materna360',
  description:
    'Ideias leves de cuidado, brincadeiras e conexão para o dia a dia com seu filho.',
}

export default function MeuFilhoPage() {
  return <MeuFilhoClient />
}
