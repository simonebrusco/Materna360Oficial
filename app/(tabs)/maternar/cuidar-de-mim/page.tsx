import Client from './Client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page() {
  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="relative min-h-[100dvh] pb-24 overflow-hidden"
    >
      <Client />
    </main>
  )
}
