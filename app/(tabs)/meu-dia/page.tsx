import dynamicImport from 'next/dynamic'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MeuDiaClient = dynamicImport(
  () => import('./Client').then(m => m.MeuDiaClient),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    )
  }
)

export default function Page() {
  return <MeuDiaClient />
}
