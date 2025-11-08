import { redirect } from 'next/navigation'
import { getServerFlags } from '@/app/lib/flags.server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  const flags = getServerFlags()
  if (flags.FF_MATERNAR_HUB) {
    redirect('/maternar')
  }
  redirect('/meu-dia')
}
