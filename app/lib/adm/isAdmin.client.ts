// app/lib/adm/isAdmin.client.ts
import { supabaseClient } from '@/app/lib/supabase'

export async function isAdminClient(): Promise<boolean> {
  const supabase = supabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return false

  // MVP: lista fixa de emails admin
  const ADMINS = ['simonebrusco@gmail.com']

  return ADMINS.includes(user.email)
}
