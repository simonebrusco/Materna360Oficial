import { cookies } from 'next/headers'

export type Profile = { motherName?: string; children?: any[] }

const KEY = 'materna360_profile'

export function readProfileCookie(jar: any): { profile: Profile; metadata: any } {
  const c = jar.get ? jar.get(KEY)?.value : null
  let profile: Profile = { motherName: 'Mãe', children: [] }
  if (c) {
    try {
      profile = JSON.parse(c) as Profile
    } catch {}
  }
  return { profile, metadata: { mode: 'single', activeChildId: null } }
}

export function profilePreferredBuckets(profile: Profile): any {
  return { ageBucket: '2-3' }
}
