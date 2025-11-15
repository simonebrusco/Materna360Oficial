import dynamicImport from 'next/dynamic'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MeuDiaClient = dynamicImport(
  () => import('./Client').then(m => m.MeuDiaClient),
  { ssr: false, loading: () => null }
)

export default function Page() {
  return <MeuDiaClient />
}
