// app/lib/adm/isAdmin.client.ts
'use client'

import { supabaseBrowser } from '@/app/lib/supabase'

export async function isAdminClient(): Promise<boolean> {
  const supabase = supabaseBrowser()

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr) return false
  if (!user?.email) return false

  // Regra: admin = existe registro em adm_admins
  const { data, error } = await supabase
    .from('adm_admins')
    .select('email')
    .eq('email', user.email)
    .maybeSingle()

  if (error) return false
  return Boolean(data?.email)
}
