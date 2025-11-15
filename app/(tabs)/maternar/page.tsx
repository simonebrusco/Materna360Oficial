import { MaternarClient } from './Client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Maternar',
  description: 'Seu espaço de acolhimento, evolução e conexão',
}

export default function MaternarPage() {
  return <MaternarClient />
}
