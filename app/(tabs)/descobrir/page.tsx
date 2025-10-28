import { cookies } from 'next/headers'
import { unstable_noStore as noStore } from 'next/cache'
import DescobrirClient from './Client'

type SearchParams = {
  [key: string]: string | string[] | undefined
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DescobrirPage({ searchParams }: { searchParams?: SearchParams }) {
  noStore()

  return (
    <DescobrirClient
      initialRecipesQuery={{ stage: 'baby' }}
      recommendationShelves={[]}
      shelves={[]}
      flags={{}}
    />
  )
}
