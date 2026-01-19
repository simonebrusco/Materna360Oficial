// app/lib/adm/requireAdmin.server.ts
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/app/lib/supabase'

export async function requireAdmin() {
  const supabase = supabaseServer()

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  const email = userData?.user?.email

  if (userErr || !email) {
    redirect('/') // não logado
  }

  const { data: adminRow, error: adminErr } = await supabase
    .from('adm_admins')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (adminErr || !adminRow) {
    redirect('/') // logado mas não é admin
  }
}
