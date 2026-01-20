'use client'

// app/lib/adm/isAdmin.client.ts
import { supabaseBrowser } from '@/app/lib/supabase.client'

const ADMINS = ['simonebrusco@gmail.com']

export async function isAdminClient(): Promise<boolean> {
  try {
    const supabase = supabaseBrowser()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) return false
    if (!user?.email) return false

    return ADMINS.includes(user.email)
  } catch {
    return false
  }
}
