import dynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MeuDiaClient = dynamic(
  () => import('./Client').then(m => m.MeuDiaClient),
  { ssr: false, loading: () => null }
)

export default function Page() {
  // Deterministic shell: real UI loads after hydration only
  return <MeuDiaClient />
}
