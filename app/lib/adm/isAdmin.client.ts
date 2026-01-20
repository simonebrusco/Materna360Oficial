// app/lib/adm/isAdmin.client.ts
'use client'

import { supabaseBrowser } from '@/app/lib/supabase'

/**
 * Regra oficial:
 * - Cliente NUNCA decide admin por hardcode.
 * - A fonte de verdade é a tabela `adm_admins` no Supabase.
 * - Este helper apenas consulta se o usuário logado consta como admin.
 */
export async function isAdminClient(): Promise<boolean> {
  const supabase = supabaseBrowser()

  // 1) garante usuário autenticado no client
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) return false

  // 2) consulta tabela de admins
  const { data, error } = await supabase
    .from('adm_admins')
    .select('email')
    .eq('email', user.email)
    .maybeSingle()

  if (error) return false

  return Boolean(data)
}
