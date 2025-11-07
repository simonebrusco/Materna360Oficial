import { redirect } from 'next/navigation'
import { getServerFlags } from '@/app/lib/flags.server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  const flags = getServerFlags()
  // Conditional redirect: hub ON → /maternar, hub OFF → /meu-dia
  redirect(flags.FF_MATERNAR_HUB ? '/maternar' : '/meu-dia')
}
