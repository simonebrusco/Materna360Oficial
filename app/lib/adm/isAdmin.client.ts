'use client'

// app/lib/adm/isAdmin.client.ts
import { supabaseBrowser } from '@/app/lib/supabase.client'

const FALLBACK_ADMINS = ['simonebrusco@gmail.com']

export async function isAdminClient(): Promise<boolean> {
  const supabase = supabaseBrowser()

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr) return false
  const email = (user?.email || '').trim().toLowerCase()
  if (!email) return false

  // Fonte da verdade: tabela adm_admins (quando liberado via RLS/policies)
  try {
    const { data, error } = await supabase.from('adm_admins').select('email').eq('email', email).limit(1)
    if (!error && (data?.length || 0) > 0) return true
  } catch {}

  // Fallback seguro
  return FALLBACK_ADMINS.includes(email)
}
