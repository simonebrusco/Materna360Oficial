import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

type Client = SupabaseClient

export function createBrowserSupabase(): Client | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
    }
    return null
  }

  return createBrowserClient(url, anonKey)
}

export function createServerSupabase(serviceKey?: string): Client {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = serviceKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured.')
  }

  const { cookies } = require('next/headers')
  const cookieStore = cookies()

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // setting cookies can fail in some render contexts (e.g. server components). swallow silently.
        }
      },
      remove(name: string, _options: CookieOptions) {
        try {
          cookieStore.delete(name)
        } catch {
          // ignore removal failures in read-only contexts
        }
      },
    },
    auth: {
      persistSession: false,
    },
  })
}

export function supabaseBrowser(): Client {
  const client = createBrowserSupabase()
  if (!client) {
    throw new Error('Supabase environment variables are not configured.')
  }
  return client
}

export const supabaseServer = createServerSupabase

export function tryCreateServerSupabase(serviceKey?: string): Client | null {
  try {
    return createServerSupabase(serviceKey)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (process.env.NODE_ENV === 'production') {
      console.error('[Supabase] Server client unavailable:', message)
    } else {
      console.warn('[Supabase] Server client unavailable:', message)
    }
    return null
  }
}
