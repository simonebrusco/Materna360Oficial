import { unstable_cache } from 'next/cache'

import { tryCreateServerSupabase } from './supabase'

type ServerProfile = {
  name: string
}

export async function getServerProfile(): Promise<ServerProfile> {
  const supabase = tryCreateServerSupabase()
  if (!supabase) {
    return { name: '' }
  }
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('[Profile] Failed to verify user:', authError.message)
  }

  if (!user) {
    return { name: '' }
  }

  const readProfile = unstable_cache(
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('[Profile] Failed to load profile:', error.message)
        return { name: '' }
      }

      const name = typeof data?.name === 'string' ? data.name.trim() : ''
      return { name }
    },
    ['profile:read', user.id],
    {
      tags: ['profile'],
      revalidate: false,
    }
  )

  return readProfile()
}
