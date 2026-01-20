'use client'

// app/lib/adm/isAdmin.client.ts
import { supabaseBrowser } from '@/app/lib/supabase'

export async function isAdminClient(): Promise<boolean> {
  try {
    const supabase = supabaseBrowser()

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr) return false
    if (!user?.email) return false

    // Preferência: checar na tabela adm_admins
    const { data, error } = await supabase
      .from('adm_admins')
      .select('email')
      .eq('email', user.email)
      .maybeSingle()

    if (error) return false
    return Boolean(data?.email)
  } catch {
    return false
  }
}
