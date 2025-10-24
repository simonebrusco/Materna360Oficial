import { unstable_cache } from 'next/cache'

import { supabaseServer } from './supabase'

type ServerProfile = {
  name: string
}

async function readProfile(): Promise<ServerProfile> {
  const supabase = supabaseServer()
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
}

export const getServerProfile = unstable_cache(readProfile, ['profile:read'], {
  tags: ['profile'],
  revalidate: 0,
})
