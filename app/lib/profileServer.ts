import { cookies } from 'next/headers'
import type { ProfileSummaryT } from '@/app/lib/discoverSchemas'
import { tryCreateServerSupabase } from '@/app/lib/supabase'

export async function getProfile(_cookies?: ReturnType<typeof cookies>): Promise<ProfileSummaryT> {
  try {
    const supabase = tryCreateServerSupabase()

    if (!supabase) {
      return {
        mode: 'single',
        activeChildId: null,
        children: [],
      }
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        mode: 'single',
        activeChildId: null,
        children: [],
      }
    }

    // Fetch user profile and children
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('mode, active_child_id')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('[ProfileServer] Failed to load profile:', profileError.message)
      return {
        mode: 'single',
        activeChildId: null,
        children: [],
      }
    }

    // Fetch children
    const { data: childrenData, error: childrenError } = await supabase
      .from('children')
      .select('id, name, age_bucket')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (childrenError) {
      console.error('[ProfileServer] Failed to load children:', childrenError.message)
      return {
        mode: 'single',
        activeChildId: profileData?.active_child_id ?? null,
        children: [],
      }
    }

    const mode = profileData?.mode === 'all' ? 'all' : 'single'
    const activeChildId = profileData?.active_child_id ?? (childrenData?.[0]?.id ?? null)

    const children = (childrenData ?? []).map((child) => ({
      id: child.id,
      name: child.name ?? undefined,
      age_bucket: child.age_bucket,
    }))

    return {
      mode,
      activeChildId,
      children,
    }
  } catch (error) {
    console.error('[ProfileServer] Unexpected error:', error)
    return {
      mode: 'single',
      activeChildId: null,
      children: [],
    }
  }
}
