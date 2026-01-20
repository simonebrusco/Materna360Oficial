// app/lib/supabase.middleware.ts
import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

type Client = SupabaseClient

export function createMiddlewareSupabaseClient(req: NextRequest, res: NextResponse): Client | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        // Middleware: escreve no response (Edge-safe)
        res.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        // Mais robusto do que só maxAge=0 em alguns ambientes
        res.cookies.set({
          name,
          value: '',
          ...options,
          maxAge: 0,
          expires: new Date(0),
        })
      },
    },
  })
}
