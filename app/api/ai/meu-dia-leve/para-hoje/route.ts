// app/api/ai/meu-dia-leve/para-hoje/route.ts
import { NextResponse } from 'next/server'
import { getAdmEditorialTextPublished } from '@/app/lib/adm/adm.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ApiResponse =
  | { ok: true; meta?: { source: 'adm' }; item: { title: string | null; body: string } }
  | { ok: false; error: string }

function supabaseRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const m = url.match(/https:\/\/([^.]+)\.supabase\.co/)
  return m?.[1] || 'no_url'
}

export async function POST() {
  try {
    const it = await getAdmEditorialTextPublished({ hub: 'meu-dia-leve', key: 'para_hoje' })

    if (!it?.body) {
      return NextResponse.json({ ok: false, error: `not_found@${supabaseRef()}` } satisfies ApiResponse, { status: 200 })
    }

    const title = it.title ? String(it.title).trim() : null
    const body = String(it.body).trim()

    if (!body) {
      return NextResponse.json({ ok: false, error: `bad_item@${supabaseRef()}` } satisfies ApiResponse, { status: 200 })
    }

    return NextResponse.json(
      { ok: true, meta: { source: 'adm' }, item: { title, body } } satisfies ApiResponse,
      { status: 200 }
    )
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: `adm_read_error@${supabaseRef()}:${String(e?.message ?? e ?? 'server_error')}` } satisfies ApiResponse,
      { status: 200 }
    )
  }
}
