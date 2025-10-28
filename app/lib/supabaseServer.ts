import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export function supabaseServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (k) => cookies().get(k)?.value } }
  )
}
