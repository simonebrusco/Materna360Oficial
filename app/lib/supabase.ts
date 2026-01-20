// app/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let _browserClient: SupabaseClient | null = null

export function supabaseBrowser(): SupabaseClient {
  if (_browserClient) return _browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  // IMPORTANT:
  // - createBrowserClient(@supabase/ssr) persiste sessão em cookies (document.cookie)
  // - isso permite o middleware (Edge) enxergar a sessão
  _browserClient = createBrowserClient(url, anon)
  return _browserClient
}
