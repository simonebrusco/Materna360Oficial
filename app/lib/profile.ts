'use server'

import { supabaseServer } from './supabase'

export async function getServerProfile(): Promise<{ name: string }> {
  const supabase = supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  return { name: typeof data?.name === 'string' ? data.name : '' }
}
