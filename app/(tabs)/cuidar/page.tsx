import { getServerProfile } from '@/app/lib/profile'
import { getServerProfile } from '@/app/lib/profile'
import { getFirstName } from '@/app/lib/strings'

import CuidarClient from './Client'

export const dynamic = 'force-dynamic'

export default async function CuidarPage() {
  const { name } = await getServerProfile()
  const firstName = getFirstName(name)

  return <CuidarClient firstName={firstName} />
}
