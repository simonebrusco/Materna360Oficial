import MeuDiaClient from './Client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page() {
  return (
    <main className="materna360-premium-bg min-h-screen">
      <MeuDiaClient />
    </main>
  )
}
