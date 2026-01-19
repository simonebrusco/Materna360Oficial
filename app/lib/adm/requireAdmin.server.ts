import { redirect } from 'next/navigation'
import { supabaseServer } from '@/app/lib/supabase'

export async function assertAdmin() {
  const supabase = supabaseServer()

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  const email = userData?.user?.email

  if (userErr || !email) {
    redirect('/login')
  }

  const { data: adminRow, error: adminErr } = await supabase
    .from('adm_admins')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (adminErr || !adminRow) {
    redirect('/meu-dia')
  }
}
